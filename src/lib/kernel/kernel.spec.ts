import { describe, expect, test, vi } from "vitest";
import {
  TRANSPORT_KINDS,
  DOMAIN_KINDS,
  FAILURE_KINDS,
  unauthenticated,
  forbidden,
  rateLimited,
  unavailable,
  timeout,
  canceled,
  internal,
  notFound,
  invalid,
  conflict,
  isFailureKind,
  isTransportKind,
  isDomainKind,
  isFailure,
  isTransport,
  isDomain,
  because,
  chain,
  rootCause,
  narrow,
  isRetryable,
  RETRY_BASE_MS,
  RETRY_CAP_MS,
  retryDelay,
  assertNever,
  Ok,
  Err,
  ok,
  err,
  all,
  andThenAsync,
  fromJSON,
  optional,
  anyNotFound,
  absentWhenType,
  presenceOf,
  AppError,
  unwrap,
  asFailure,
} from "./index";
import type { Failure } from "./index";

// ---------------------------------------------------------------------------
// Shared fixtures: one constructor per kind, keyed by the kind name the
// specification itself gives. These names are stated in F1, not guessed.
// ---------------------------------------------------------------------------

const TRANSPORT_CTORS: Record<string, (msg: string) => Failure> = {
  unauthenticated: (m) => unauthenticated(m),
  forbidden: (m) => forbidden(m),
  rate_limited: (m) => rateLimited(m, 7),
  unavailable: (m) => unavailable(m),
  timeout: (m) => timeout(m),
  canceled: (m) => canceled(m),
  internal: (m) => internal(m),
};

const DOMAIN_CTORS: Record<string, (msg: string) => Failure> = {
  not_found: (m) => notFound(m),
  invalid: (m) => invalid(m, { field: "bad" }),
  conflict: (m) => conflict(m),
};

const ALL_CTORS: Record<string, (msg: string) => Failure> = {
  ...TRANSPORT_CTORS,
  ...DOMAIN_CTORS,
};

// ===========================================================================
// F1 / F2 — the ten kinds, closed, disjoint, exhaustive
// ===========================================================================

describe("the closed kind sets match the specification exactly", () => {
  test("TRANSPORT_KINDS is exactly the seven transport kinds, in the specified order", () => {
    expect(TRANSPORT_KINDS).toEqual([
      "unauthenticated",
      "forbidden",
      "rate_limited",
      "unavailable",
      "timeout",
      "canceled",
      "internal",
    ]);
  });

  test("DOMAIN_KINDS is exactly the three domain kinds, in the specified order", () => {
    expect(DOMAIN_KINDS).toEqual(["not_found", "invalid", "conflict"]);
  });

  test("FAILURE_KINDS is exactly the ten kinds, in the specified order", () => {
    expect(FAILURE_KINDS).toEqual([
      "unauthenticated",
      "forbidden",
      "rate_limited",
      "unavailable",
      "timeout",
      "canceled",
      "internal",
      "not_found",
      "invalid",
      "conflict",
    ]);
  });
});

describe("FAILURE_KINDS: transport and domain partition the ten kinds", () => {
  test("transport and domain are disjoint: no kind is classified as both", () => {
    const overlap = TRANSPORT_KINDS.filter((k) =>
      (DOMAIN_KINDS as readonly string[]).includes(k),
    );
    expect(
      overlap,
      "a kind in both sets breaks the split the whole model depends on (F2)",
    ).toEqual([]);
  });

  test("transport and domain are exhaustive: together they are exactly FAILURE_KINDS", () => {
    const union = new Set<string>([...TRANSPORT_KINDS, ...DOMAIN_KINDS]);
    const declared = new Set<string>(FAILURE_KINDS);
    expect(
      union,
      "every kind must be in exactly one of the two sets, and no kind may be left out",
    ).toEqual(declared);
  });

  test.each(TRANSPORT_KINDS.map((k) => [k]))(
    "%s is classified as transport by the predicates, never as domain",
    (kind) => {
      expect(
        isTransportKind(kind),
        `${kind} is a transport kind; isTransportKind must agree with TRANSPORT_KINDS`,
      ).toBe(true);
      expect(
        isDomainKind(kind),
        `${kind} is transport; reclassifying it as domain breaks F2`,
      ).toBe(false);
    },
  );

  test.each(DOMAIN_KINDS.map((k) => [k]))(
    "%s is classified as domain by the predicates, never as transport",
    (kind) => {
      expect(isDomainKind(kind)).toBe(true);
      expect(isTransportKind(kind)).toBe(false);
    },
  );

  test.each(FAILURE_KINDS.map((k) => [k]))(
    "%s is recognised as a failure kind",
    (kind) => {
      expect(isFailureKind(kind)).toBe(true);
    },
  );

  test.each([
    ["bogus"],
    [""],
    [null],
    [undefined],
    [42],
    [{}],
    [[]],
    [Symbol("x")],
  ])(
    "a value outside the ten, like %s, is never a failure kind — the set is closed",
    (v) => {
      expect(isFailureKind(v)).toBe(false);
    },
  );

  test.each(Object.entries(ALL_CTORS))(
    "isTransport and isDomain are mutually exclusive and exhaustive for a %s failure",
    (_kind, make) => {
      const f = make("x");
      expect(
        isTransport(f) !== isDomain(f),
        "every failure is transport or domain, never both, never neither",
      ).toBe(true);
    },
  );
});

// ===========================================================================
// F3 — constructors and their metadata
// ===========================================================================

describe("failure constructors: the shared metadata, and the two payloads that are not shared", () => {
  test("message is required and preserved verbatim", () => {
    expect(internal("disk on fire").message).toBe("disk on fire");
  });

  test.each([
    ["unauthenticated", unauthenticated],
    ["forbidden", forbidden],
    ["unavailable", unavailable],
    ["timeout", timeout],
    ["canceled", canceled],
    ["internal", internal],
    ["not_found", notFound],
    ["conflict", conflict],
  ] as const)(
    "%s carries no invented payload beyond the shared metadata",
    (kind, ctor) => {
      const f = ctor("msg") as unknown as Record<string, unknown>;
      expect(f.kind).toBe(kind);
      expect(
        "retryAfter" in f,
        "a constructor for a kind with no extra payload must not invent one (F3)",
      ).toBe(false);
      expect(
        "fields" in f,
        "a constructor for a kind with no extra payload must not invent one (F3)",
      ).toBe(false);
    },
  );

  test("rate_limited may carry retryAfter, and it is absent — not zero, not null — when not given", () => {
    const withDelay = rateLimited("slow down", 30);
    expect(withDelay.retryAfter).toBe(30);
    expect(
      (rateLimited("slow down") as unknown as { retryAfter?: number })
        .retryAfter,
    ).toBeUndefined();
  });

  test("invalid always carries fields, defaulting to an empty map rather than being absent", () => {
    const withNothingNamed = invalid("bad request");
    expect(
      withNothingNamed.fields,
      "a caller iterating fields must not have to test for its existence (F3)",
    ).toEqual({});
    expect(invalid("bad request", { email: "required" }).fields).toEqual({
      email: "required",
    });
  });

  test("optional metadata passes through verbatim when supplied", () => {
    const cause = internal("root");
    const f = forbidden("nope", {
      type: "acme.forbidden",
      requestId: "req-1",
      correlationId: "corr-1",
      status: 403,
      cause,
    });
    expect(f.type).toBe("acme.forbidden");
    expect(f.requestId).toBe("req-1");
    expect(f.correlationId).toBe("corr-1");
    expect(f.status).toBe(403);
    expect(f.cause).toBe(cause);
  });

  test("optional metadata is absent, not defaulted to a sentinel, when not supplied", () => {
    const f = forbidden("nope");
    expect(f.type).toBeUndefined();
    expect(f.requestId).toBeUndefined();
    expect(f.correlationId).toBeUndefined();
    expect(f.status).toBeUndefined();
    expect(f.cause).toBeUndefined();
  });
});

// ===========================================================================
// F9 — structural recognition
// ===========================================================================

describe("isFailure: recognition is structural, not by identity or prototype", () => {
  test("a plain object with a valid kind and a string message is a failure", () => {
    expect(isFailure({ kind: "internal", message: "x" })).toBe(true);
  });

  test("an unknown kind disqualifies an otherwise plausible shape — the kind set is closed", () => {
    expect(isFailure({ kind: "teapot", message: "x" })).toBe(false);
  });

  test("a missing message disqualifies an otherwise valid kind", () => {
    expect(isFailure({ kind: "internal" })).toBe(false);
  });

  test("a non-string message disqualifies an otherwise valid kind", () => {
    expect(isFailure({ kind: "internal", message: 42 })).toBe(false);
  });

  test.each([[null], [undefined], ["x"], [42], [[]], [Symbol("x")]])(
    "a bare non-object value %s is not a failure",
    (v) => {
      expect(isFailure(v)).toBe(false);
    },
  );

  test("recognition survives a JSON round trip — a failure that crossed a boundary is a different object and must still be recognised", () => {
    const original = invalid("bad", { name: "required" }, { requestId: "r-1" });
    const crossed = JSON.parse(JSON.stringify(original));
    expect(crossed).not.toBe(original);
    expect(isFailure(crossed)).toBe(true);
  });

  test("recognition does not depend on prototype", () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.kind = "not_found";
    bare.message = "gone";
    expect(
      isFailure(bare),
      "a prototypeless object with the right shape is still a failure",
    ).toBe(true);
  });
});

// ===========================================================================
// F4 — narrow
// ===========================================================================

describe("narrow: transport passes through unconditionally, promised domain is exempt, the rest folds", () => {
  test.each(Object.entries(TRANSPORT_CTORS))(
    "a transport failure of kind %s passes through narrow unchanged, no matter what is promised",
    (_kind, make) => {
      const built = make("transport failure");
      const mapper = narrow("conflict");
      expect(
        mapper(built),
        "a transport condition can happen on any call; narrowing must never rewrite it (F2, F4)",
      ).toBe(built);
    },
  );

  test("a promised domain kind passes through narrow unchanged", () => {
    const built = notFound("missing");
    const mapper = narrow("not_found", "conflict");
    expect(mapper(built)).toBe(built);
  });

  test.each(Object.entries(DOMAIN_CTORS))(
    "an unpromised domain failure of kind %s folds to internal, carrying the original as its cause",
    (_kind, make) => {
      const original = make("domain failure") as Failure & {
        type?: string;
        requestId?: string;
        correlationId?: string;
        status?: number;
      };
      original.type = "acme.type";
      original.requestId = "req-1";
      original.correlationId = "corr-1";
      original.status = 409;

      const mapper = narrow(); // promises nothing
      const folded = mapper(original);

      expect(
        folded.kind,
        "a contract break must be made safe as internal, not silently answered as a different domain kind",
      ).toBe("internal");
      expect(folded.message).toBe(original.message);
      expect(folded.type).toBe(original.type);
      expect(folded.requestId).toBe(original.requestId);
      expect(folded.correlationId).toBe(original.correlationId);
      expect(folded.status).toBe(original.status);
      expect(
        folded.cause,
        "a fold that dropped the cause would be indistinguishable from an internal error that happened on its own (F4)",
      ).toBe(original);
    },
  );

  test("folding never invents a fields or retryAfter payload on the resulting internal failure", () => {
    const folded = narrow()(
      invalid("bad", { name: "required" }),
    ) as unknown as Record<string, unknown>;
    expect("fields" in folded).toBe(false);
    expect("retryAfter" in folded).toBe(false);
  });

  test("narrowing is idempotent for a transport value it already accepts", () => {
    const built = unavailable("down");
    const mapper = narrow("conflict");
    const once = mapper(built);
    const twice = mapper(once);
    expect(
      twice,
      "narrowing a value narrow already accepts must not change it further (F4)",
    ).toBe(once);
  });

  test("narrowing is idempotent for a domain value it already promised", () => {
    const built = conflict("moved underneath");
    const mapper = narrow("conflict");
    const once = mapper(built);
    const twice = mapper(once);
    expect(twice).toBe(once);
  });

  test("narrowing is idempotent for a value it just folded — the fold produced an internal, which is transport", () => {
    const mapper = narrow();
    const folded = mapper(invalid("bad"));
    const again = mapper(folded);
    expect(
      again,
      "internal is a transport kind, so a second pass must pass it through unchanged",
    ).toBe(folded);
  });

  test("a mapper built with no allowed kinds still passes every transport kind", () => {
    const mapper = narrow();
    for (const make of Object.values(TRANSPORT_CTORS)) {
      const built = make("x");
      expect(mapper(built)).toBe(built);
    }
  });

  test("a mapper built with no allowed kinds folds every domain kind", () => {
    const mapper = narrow();
    for (const make of Object.values(DOMAIN_CTORS)) {
      expect(mapper(make("x")).kind).toBe("internal");
    }
  });
});

// ===========================================================================
// F5 — because / chain / rootCause
// ===========================================================================

describe("because: attaching a cause produces a new failure and mutates neither side", () => {
  test("produces a new failure, distinct from the original", () => {
    const original = internal("outer");
    const withCause = because(original, internal("inner"));
    expect(withCause).not.toBe(original);
  });

  test("the original failure is left exactly as it was", () => {
    const original = internal("outer");
    const snapshot = { ...original };
    because(original, internal("inner"));
    expect(
      original,
      "a caller holding the original must not observe a cause appearing on it after the call",
    ).toEqual(snapshot);
  });

  test("the cause is left exactly as it was", () => {
    const cause = internal("inner");
    const snapshot = { ...cause };
    because(internal("outer"), cause);
    expect(
      cause,
      "a caller holding the cause must not observe it changing",
    ).toEqual(snapshot);
  });

  test("the new failure carries the given cause", () => {
    const cause = internal("inner");
    const withCause = because(internal("outer"), cause);
    expect(withCause.cause).toBe(cause);
  });

  test("the new failure keeps the kind and message of the original", () => {
    const withCause = because(conflict("moved underneath"), internal("inner"));
    expect(withCause.kind).toBe("conflict");
    expect(withCause.message).toBe("moved underneath");
  });
});

describe("chain: outermost first, at least the failure itself, and finite even on a cycle", () => {
  test("a failure with no cause yields a chain of exactly itself", () => {
    const f = internal("alone");
    const c = chain(f);
    expect(
      c,
      "the chain always contains at least the failure it was asked about (F5)",
    ).toHaveLength(1);
    expect(c[0]).toEqual(f);
  });

  test("a failure with one cause yields the failure, then the cause, outermost first", () => {
    const cause = internal("root cause");
    const outer = because(conflict("surface"), cause);
    const c = chain(outer);
    expect(c).toHaveLength(2);
    expect(c[0]).toEqual(outer);
    expect(c[1]).toEqual(cause);
  });

  test("rootCause of a failure with no cause is the failure itself", () => {
    const f = internal("alone");
    expect(rootCause(f)).toEqual(f);
  });

  test("rootCause is the last element of the chain", () => {
    const root = internal("root");
    const middle = because(unavailable("middle"), root);
    const outer = because(conflict("outer"), middle);
    expect(rootCause(outer)).toEqual(root);
  });

  test("a cycle terminates the chain rather than looping, and no failure appears twice", () => {
    const a = internal("a") as Failure & { cause?: Failure };
    const b = internal("b") as Failure & { cause?: Failure };
    a.cause = b;
    b.cause = a;

    const c = chain(a);
    expect(
      c,
      "a chain reachable from itself must terminate; the alternative is a hang in the one code path that runs when something is already wrong (F5)",
    ).toHaveLength(2);
    const seen = new Set(c);
    expect(seen.size, "no failure may appear twice in a terminated chain").toBe(
      c.length,
    );
  });
});

// ===========================================================================
// F6 / F7 — retryability and delay
// ===========================================================================

describe("isRetryable: exactly three kinds are retryable, and a refusal is never one", () => {
  const RETRYABLE = new Set(["rate_limited", "unavailable", "timeout"]);

  test.each(Object.entries(ALL_CTORS))(
    "%s retryability matches the retryable set stated in F6",
    (kind, make) => {
      expect(isRetryable(make("x"))).toBe(RETRYABLE.has(kind));
    },
  );

  test("canceled is never retryable: it is an answer the caller asked for, not an interruption", () => {
    expect(
      isRetryable(canceled("nevermind")),
      "retrying a cancellation would be doing the thing the caller just stopped (F6)",
    ).toBe(false);
  });
});

describe("retryDelay: the server is honored before the client backs off on its own schedule", () => {
  test.each(Object.entries(DOMAIN_CTORS))(
    "a %s failure has no delay at all — absence, not zero, because it is not retryable",
    (_kind, make) => {
      expect(retryDelay(make("x"), 1)).toBeNull();
    },
  );

  test("canceled has no delay: retrying would repeat what the caller asked to stop", () => {
    expect(retryDelay(canceled("nevermind"), 1)).toBeNull();
  });

  test("unauthenticated, forbidden — refusals — have no delay", () => {
    expect(retryDelay(unauthenticated("x"), 1)).toBeNull();
    expect(retryDelay(forbidden("x"), 1)).toBeNull();
  });

  test("rate_limited with a server-stated retryAfter uses exactly that value, converted seconds to milliseconds", () => {
    const f = rateLimited("slow down", 5);
    expect(retryDelay(f, 1)).toBe(5 * 1000);
  });

  test("the server's retryAfter overrides the attempt-based schedule entirely", () => {
    const f = rateLimited("slow down", 5);
    expect(retryDelay(f, 1)).toBe(retryDelay(f, 10));
  });

  test.each([
    ["unavailable", () => unavailable("down")],
    ["timeout", () => timeout("slow")],
    [
      "rate_limited without a stated retryAfter",
      () => rateLimited("slow down"),
    ],
  ] as const)(
    "%s has a positive delay that grows with the attempt and never exceeds the cap",
    (_label, make) => {
      const delays = [1, 2, 3, 4, 5].map((attempt) =>
        retryDelay(make(), attempt),
      );
      for (const d of delays) {
        expect(d, "a retryable failure must have a delay").not.toBeNull();
        expect(
          d as number,
          "a delay must be positive — zero and a delay are different facts (F7)",
        ).toBeGreaterThan(0);
        expect(
          d as number,
          "an outage must not produce an unbounded wait (F7)",
        ).toBeLessThanOrEqual(RETRY_CAP_MS);
      }
      for (let i = 1; i < delays.length; i++) {
        expect(
          delays[i] as number,
          "the delay must never shrink as attempts accumulate — it is non-decreasing (F7)",
        ).toBeGreaterThanOrEqual(delays[i - 1] as number);
      }
    },
  );

  test("RETRY_BASE_MS and RETRY_CAP_MS are positive, and the base never exceeds the cap", () => {
    expect(RETRY_BASE_MS).toBeGreaterThan(0);
    expect(RETRY_CAP_MS).toBeGreaterThan(0);
    expect(RETRY_BASE_MS).toBeLessThanOrEqual(RETRY_CAP_MS);
  });
});

// ===========================================================================
// R1 / R2 — Ok / Err construction and serialisation
// ===========================================================================

describe("Ok and Err: a result is boolean-discriminated, and a constructor returns the narrowed side", () => {
  test("ok() produces a result whose value is readable without a narrowing step", () => {
    const r = ok(5);
    expect(r.ok).toBe(true);
    expect(r.value).toBe(5);
  });

  test("err() produces a result whose error is readable without a narrowing step", () => {
    const f = internal("boom");
    const r = err(f);
    expect(r.ok).toBe(false);
    expect(r.error).toBe(f);
  });

  test("Ok and Err are classes, distinguishable by instanceof", () => {
    expect(ok(1)).toBeInstanceOf(Ok);
    expect(err(internal("x"))).toBeInstanceOf(Err);
  });
});

describe("serialisation: a result degrades to a readable object, and a rehydrator reads it back (R2)", () => {
  test("Ok.toJSON is a readable object, not an empty one", () => {
    expect(ok(5).toJSON()).toEqual({ ok: true, value: 5 });
  });

  test("Err.toJSON is a readable object, not an empty one", () => {
    const f = internal("x");
    expect(err(f).toJSON()).toEqual({ ok: false, error: f });
  });

  test("JSON.stringify on a success produces the value, not an empty object", () => {
    expect(JSON.stringify(ok(5))).toBe(JSON.stringify({ ok: true, value: 5 }));
  });

  test("fromJSON rehydrates a success as an Ok instance", () => {
    const r = fromJSON({ ok: true, value: 5 });
    expect(r).toBeInstanceOf(Ok);
    expect((r as Ok<number>).value).toBe(5);
  });

  test("fromJSON rehydrates a failure as an Err instance", () => {
    const f = internal("x");
    const r = fromJSON({ ok: false, error: f });
    expect(r).toBeInstanceOf(Err);
    expect((r as Err<never, Failure>).error).toEqual(f);
  });

  test("a result round-trips through JSON.stringify and fromJSON to an equivalent result", () => {
    const original = ok({ id: 1 });
    const revived = fromJSON(JSON.parse(JSON.stringify(original)));
    expect(revived).toEqual(original);
  });
});

// ===========================================================================
// R3 — map / mapErr
// ===========================================================================

describe("map / mapErr: mapping touches one side and leaves the other identical (R3)", () => {
  test("Ok.map transforms the value", () => {
    const r = ok(2).map((v) => v * 10);
    expect(r).toBeInstanceOf(Ok);
    expect((r as Ok<number>).value).toBe(20);
  });

  test("Ok.mapErr leaves a success unchanged, not rebuilt with equal contents", () => {
    const original = ok(2);
    const r = original.mapErr((e) => e);
    expect(
      r,
      "mapping the failure side of a success must not touch the success",
    ).toBe(original);
  });

  test("Err.map leaves a failure unchanged, not rebuilt with equal contents", () => {
    const original = err(internal("x"));
    const r = original.map((v) => v);
    expect(
      r,
      "mapping the value side of a failure must not touch the failure",
    ).toBe(original);
  });

  test("Err.mapErr transforms the error", () => {
    const r = err(internal("x")).mapErr((e) => e.message);
    expect(r).toBeInstanceOf(Err);
    expect((r as Err<never, string>).error).toBe("x");
  });

  test("mapping a success with the identity function returns an equivalent result", () => {
    const original = ok(7);
    expect(original.map((v) => v)).toEqual(original);
  });

  test("mapping a failure with the identity function returns an equivalent result", () => {
    const original = err(internal("x"));
    expect(original.mapErr((e) => e)).toEqual(original);
  });
});

// ===========================================================================
// R4 — andThen
// ===========================================================================

describe("andThen: sequencing short-circuits on the first failure, and the type widens (R4)", () => {
  test("Ok.andThen runs the step and yields what it returned", () => {
    const r = ok(2).andThen((v) => ok(v + 1));
    expect(r).toEqual(ok(3));
  });

  test("Err.andThen does not run the step", () => {
    const step = vi.fn(() => ok(1));
    err(internal("x")).andThen(step as unknown as (v: never) => never);
    expect(
      step,
      "chaining onto a failure must not run the next step (R4)",
    ).not.toHaveBeenCalled();
  });

  test("Err.andThen returns the same failure unchanged", () => {
    const original = err(internal("x"));
    const r = original.andThen((v) => ok(v));
    expect(r).toBe(original);
  });

  test("a chain of steps yields the first failure encountered, and every later step is skipped", () => {
    const secondStep = vi.fn(() => ok("unreachable"));
    const firstFailure = internal("first");
    const r = ok(1)
      .andThen(() => err<number, Failure>(firstFailure))
      .andThen(secondStep as unknown as (v: number) => never);
    expect(
      secondStep,
      "the first failure in a chain must short-circuit every step after it (R4)",
    ).not.toHaveBeenCalled();
    expect(r).toEqual(err(firstFailure));
  });
});

// ===========================================================================
// R5 — match
// ===========================================================================

describe("match: both branches are required and total, and only one ever runs (R5)", () => {
  test("a success calls the ok branch with its value, never the err branch", () => {
    const onOk = vi.fn((v: number) => v * 2);
    const onErr = vi.fn(() => -1);
    const result = ok(3).match({ ok: onOk, err: onErr });
    expect(onOk).toHaveBeenCalledWith(3);
    expect(onErr).not.toHaveBeenCalled();
    expect(result).toBe(6);
  });

  test("a failure calls the err branch with its error, never the ok branch", () => {
    const f = internal("x");
    const onOk = vi.fn((): string => "not called");
    const onErr = vi.fn((e: Failure) => e.message);
    const result = err(f).match({ ok: onOk, err: onErr });
    expect(onErr).toHaveBeenCalledWith(f);
    expect(onOk).not.toHaveBeenCalled();
    expect(result).toBe("x");
  });
});

// ===========================================================================
// R6 — unwrapOr
// ===========================================================================

describe("unwrapOr: a fallback is used only on the failing side (R6)", () => {
  test("a success returns its own value even when a fallback is supplied", () => {
    expect(ok(9).unwrapOr(100)).toBe(9);
  });

  test.each([[0], [null], [false], [""]])(
    "a success holding the falsy value %s still wins over the fallback",
    (falsy) => {
      expect(
        ok(falsy).unwrapOr("fallback" as never),
        "a falsy success value is not the same fact as an absent one (R6)",
      ).toBe(falsy);
    },
  );

  test("a failure returns the fallback", () => {
    expect(err<number>(internal("x")).unwrapOr(42)).toBe(42);
  });
});

// ===========================================================================
// R7 — tapErr
// ===========================================================================

describe("tapErr: a failure-side side effect cannot change what the caller sees (R7)", () => {
  test("Ok.tapErr does not run the effect and returns the same success", () => {
    const effect = vi.fn();
    const original = ok(5);
    const r = original.tapErr(effect);
    expect(effect).not.toHaveBeenCalled();
    expect(r).toBe(original);
  });

  test("Err.tapErr runs the effect but returns the same failure unchanged", () => {
    const effect = vi.fn();
    const f = internal("x");
    const original = err(f);
    const r = original.tapErr(effect);
    expect(effect).toHaveBeenCalledWith(f);
    expect(r).toBe(original);
  });

  test("removing a tapErr call from a chain does not change the chain's result", () => {
    const withTap = ok(1)
      .andThen(() => err<number, Failure>(internal("boom")))
      .tapErr(() => {})
      .unwrapOr(-1);
    const withoutTap = ok(1)
      .andThen(() => err<number, Failure>(internal("boom")))
      .unwrapOr(-1);
    expect(
      withTap,
      "inserting a side-effecting call anywhere in a chain must be invisible to the value (R7)",
    ).toBe(withoutTap);
  });
});

// ===========================================================================
// R8 — all
// ===========================================================================

describe("all: every value in order, or the first failure (R8)", () => {
  test("three successes combine into one success holding all three values, positionally", () => {
    expect(all([ok(1), ok("two"), ok(true)])).toEqual(ok([1, "two", true]));
  });

  test("combining nothing is a success holding nothing", () => {
    expect(all([])).toEqual(ok([]));
  });

  test("the first failure wins, even when a later result also fails", () => {
    const first = internal("first");
    const second = internal("second");
    const r = all([ok(1), err(first), err(second)]);
    expect(
      r,
      "a screen rendering one problem has no use for the rest; combining is first-failure, not all-failures (R8)",
    ).toEqual(err(first));
  });

  test("a failure earlier in the input order wins over a success that follows it", () => {
    const first = internal("first");
    expect(all([err(first), ok(1)])).toEqual(err(first));
  });
});

// ===========================================================================
// andThenAsync — the asynchronous analogue of andThen
// (Inference: the spec's prose for R4 covers only the synchronous andThen;
//  andThenAsync's behaviour is inferred from its name and signature to mirror
//  the same short-circuit rule. Flagged in the report.)
// ===========================================================================

describe("andThenAsync: the asynchronous analogue of andThen", () => {
  test("a success runs the async step and resolves to what it returned", async () => {
    const r = await andThenAsync(ok(2), async (v: number) => ok(v + 1));
    expect(r).toEqual(ok(3));
  });

  test("a failure does not run the async step and resolves to the same failure", async () => {
    const step = vi.fn(async () => ok(1));
    const f = internal("x");
    const r = await andThenAsync(
      err(f),
      step as unknown as (v: never) => Promise<never>,
    );
    expect(step).not.toHaveBeenCalled();
    expect(r).toEqual(err(f));
  });
});

// ===========================================================================
// A1 / A2 — optional, anyNotFound, absentWhenType
// ===========================================================================

describe("optional: legitimate absence becomes a value, and an unrecognised not_found does not (A1)", () => {
  test("a success passes through unchanged", async () => {
    const original = ok(5);
    expect(await optional(original, anyNotFound)).toEqual(original);
  });

  test("a failure that is not not_found passes through unchanged", async () => {
    const original = err(internal("boom"));
    expect(await optional(original, anyNotFound)).toEqual(original);
  });

  test("a recognised not_found becomes a success holding null", async () => {
    const original = err(notFound("gone", { type: "acme.missing" }));
    const r = await optional(original, absentWhenType("acme.missing"));
    expect(r).toEqual(ok(null));
  });

  test("an unrecognised not_found folds to internal rather than being reported as emptiness", async () => {
    const original = notFound("gone", { type: "acme.missing" });
    const r = await optional(err(original), absentWhenType("some.other.type"));
    expect(
      r.ok,
      "a not_found the predicate does not recognise must not be reported as emptiness — that would be a screen confidently reporting a measurement that never happened (A1)",
    ).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("internal");
      expect(
        r.error.cause,
        "the fold must preserve the original failure as its cause, or the diagnosis is lost (F4)",
      ).toEqual(original);
    }
  });

  test("optional accepts a bare result as well as a promise of one, and always answers with a promise", () => {
    const r = optional(ok(1), anyNotFound);
    expect(r).toBeInstanceOf(Promise);
  });
});

describe("anyNotFound / absentWhenType: the two shipped predicates (A2)", () => {
  test("anyNotFound is the weak choice: it accepts any not_found at all", () => {
    expect(anyNotFound()).toBe(true);
  });

  test("absentWhenType recognises only its own named type", () => {
    const predicate = absentWhenType("acme.missing");
    expect(predicate(notFound("x", { type: "acme.missing" }))).toBe(true);
    expect(predicate(notFound("x", { type: "acme.other" }))).toBe(false);
  });

  test("absentWhenType does not recognise a not_found with no type at all", () => {
    expect(absentWhenType("acme.missing")(notFound("x"))).toBe(false);
  });
});

// ===========================================================================
// A3 — presenceOf
// ===========================================================================

describe("presenceOf: three states, and a measured zero is never mistaken for unmeasured (A3)", () => {
  test("a value renders as found", () => {
    expect(presenceOf(ok("hello"))).toEqual({ state: "found", value: "hello" });
  });

  test("a measured zero renders as found, never as empty and never as the same thing an unmeasured total renders as", () => {
    expect(
      presenceOf(ok(0)),
      "an unmeasured total must never render as the same thing a measured zero renders as (A3)",
    ).toEqual({ state: "found", value: 0 });
  });

  test("a null value renders as empty: looked, and there was nothing", () => {
    expect(presenceOf(ok(null))).toEqual({ state: "empty" });
  });

  test("a failure renders as unmeasured, carrying the failure that stopped it", () => {
    const f = internal("down");
    expect(presenceOf(err(f))).toEqual({ state: "unmeasured", failure: f });
  });

  test.each([
    ["a found value", ok("x")],
    ["an empty value", ok(null)],
    ["an unmeasured value", err(internal("x"))],
  ] as const)(
    "%s maps to exactly one of the three named states, never a fourth",
    (_label, r) => {
      const p = presenceOf(r);
      expect(["found", "empty", "unmeasured"]).toContain(p.state);
    },
  );
});

// ===========================================================================
// E1 / E2 — AppError and unwrap
// ===========================================================================

describe("AppError: exactly one class is ever thrown, and it carries a failure (E1)", () => {
  test("is an Error, and carries the exact failure it wraps", () => {
    const f = internal("boom");
    const e = new AppError(f);
    expect(e).toBeInstanceOf(Error);
    expect(e.failure).toBe(f);
  });
});

describe("unwrap: the single sanctioned unwrap (E2)", () => {
  test("returns the value of a success", () => {
    expect(unwrap(ok(5))).toBe(5);
  });

  test("throws AppError for a failure, and the thrown error carries that exact failure", () => {
    const f = internal("boom");
    expect(() => unwrap(err(f))).toThrow(AppError);
    try {
      unwrap(err(f));
      throw new Error(
        "unwrap must throw for a failure — this line must not be reached",
      );
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).failure).toBe(f);
    }
  });
});

// ===========================================================================
// F10 / E3 — asFailure: total conversion
// ===========================================================================

describe("asFailure: converting an unknown value is total and never throws (F10, E3)", () => {
  test("a failure is returned unchanged", () => {
    const f = internal("x");
    expect(asFailure(f)).toBe(f);
  });

  test("the wrapper (AppError) yields the failure it carries", () => {
    const f = internal("x");
    expect(asFailure(new AppError(f))).toBe(f);
  });

  test('a plain Error becomes internal, keeping its message and recording "Error" as its type', () => {
    const f = asFailure(new Error("plain"));
    expect(f.kind).toBe("internal");
    expect(f.message).toBe("plain");
    expect(f.type).toBe("Error");
  });

  test("a platform error subclass becomes internal, keeping its message and recording its own name as type", () => {
    const f = asFailure(new TypeError("boom"));
    expect(f.kind).toBe("internal");
    expect(f.message).toBe("boom");
    expect(f.type).toBe("TypeError");
  });

  test.each([["a string"], [null], [undefined], [42], [true], [Symbol("x")]])(
    "anything else, like %s, becomes internal with a showable string message, and never throws",
    (v) => {
      let f: Failure | undefined;
      expect(() => {
        f = asFailure(v);
      }).not.toThrow();
      expect(f!.kind).toBe("internal");
      expect(typeof f!.message).toBe("string");
    },
  );

  test(
    "an object carrying a failure yields the one it carries " +
      "(inference: assumed to mirror the {failure} shape AppError itself uses, since that is the only carrier shape the API describes)",
    () => {
      const f = internal("x");
      expect(asFailure({ failure: f })).toBe(f);
    },
  );

  test("a circular object does not hang or throw the conversion", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    let f: Failure | undefined;
    expect(() => {
      f = asFailure(circular);
    }).not.toThrow();
    expect(f!.kind).toBe("internal");
  });

  test("an object whose property access throws does not break the total conversion", () => {
    const hostile: Record<string, unknown> = {};
    Object.defineProperty(hostile, "kind", {
      get() {
        throw new Error("gotcha");
      },
    });
    let f: Failure | undefined;
    expect(() => {
      f = asFailure(hostile);
    }).not.toThrow();
    expect(f!.kind).toBe("internal");
  });
});

// ===========================================================================
// F11 — assertNever
// ===========================================================================

describe("assertNever: exhaustiveness is enforced at the one place a switch runs out of kinds (F11)", () => {
  test("always throws when reached — reaching it means an impossible case occurred", () => {
    expect(() => assertNever("unexpected" as never)).toThrow();
  });

  test("an optional context argument does not suppress the throw", () => {
    expect(() => assertNever("unexpected" as never, "somewhere")).toThrow();
  });
});
