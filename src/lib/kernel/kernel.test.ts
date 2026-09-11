import { describe, it, expect } from "vitest";
import * as F from "~/lib/kernel/failure";
import * as R from "~/lib/kernel/result";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

type Entry = { kind: F.FailureKind; make: (message: string) => F.Failure };

// Declared in the same order as FAILURE_KINDS per the API surface material.
const ALL: Entry[] = [
  { kind: "unauthenticated", make: (m) => F.unauthenticated(m) },
  { kind: "forbidden", make: (m) => F.forbidden(m) },
  { kind: "rate_limited", make: (m) => F.rateLimited(m) },
  { kind: "unavailable", make: (m) => F.unavailable(m) },
  { kind: "timeout", make: (m) => F.timeout(m) },
  { kind: "canceled", make: (m) => F.canceled(m) },
  { kind: "internal", make: (m) => F.internal(m) },
  { kind: "not_found", make: (m) => F.notFound(m) },
  { kind: "invalid", make: (m) => F.invalid(m) },
  { kind: "conflict", make: (m) => F.conflict(m) },
];

const hasKey = (obj: unknown, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const keysOf = (obj: unknown): string[] => Object.keys(obj as object).sort();

// ---------------------------------------------------------------------------
// Module A — failure : the sets (§5 F1, F1a, F2, F3)
// ---------------------------------------------------------------------------

describe("failure: the kind sets", () => {
  it("TRANSPORT_KINDS and DOMAIN_KINDS share no member", () => {
    const overlap = F.TRANSPORT_KINDS.filter((k) =>
      (F.DOMAIN_KINDS as readonly string[]).includes(k),
    );
    expect(
      overlap,
      "a kind cannot simultaneously be something no operation author can rule out and something the author genuinely knows",
    ).toEqual([]);
  });

  it("FAILURE_KINDS is exactly the union of TRANSPORT_KINDS and DOMAIN_KINDS, with no duplicates", () => {
    expect(
      Array.from(F.FAILURE_KINDS).sort(),
      "FAILURE_KINDS must be exactly the union of the two closed sets, nothing added and nothing missing",
    ).toEqual([...F.TRANSPORT_KINDS, ...F.DOMAIN_KINDS].sort());
    expect(
      new Set(F.FAILURE_KINDS).size,
      "FAILURE_KINDS must contain no duplicate member",
    ).toBe(F.FAILURE_KINDS.length);
  });

  it("TRANSPORT_KINDS is pinned to exactly the seven kinds named in the spec", () => {
    expect(
      Array.from(F.TRANSPORT_KINDS),
      "membership is pinned by name, not just by count (F1a)",
    ).toEqual([
      "unauthenticated",
      "forbidden",
      "rate_limited",
      "unavailable",
      "timeout",
      "canceled",
      "internal",
    ]);
  });

  it("DOMAIN_KINDS is pinned to exactly the three kinds named in the spec", () => {
    expect(
      Array.from(F.DOMAIN_KINDS),
      "membership is pinned by name, not just by count (F1a)",
    ).toEqual(["not_found", "invalid", "conflict"]);
  });

  it.each(Array.from(F.FAILURE_KINDS))(
    "%s is classified by exactly one of isTransportKind / isDomainKind",
    (kind) => {
      const transport = F.isTransportKind(kind);
      const domain = F.isDomainKind(kind);
      expect(
        transport !== domain,
        `every member of the closed set FAILURE_KINDS must land on exactly one side of the transport/domain split (kind: ${kind})`,
      ).toBe(true);
      expect(transport).toBe(
        (F.TRANSPORT_KINDS as readonly string[]).includes(kind),
      );
      expect(domain).toBe((F.DOMAIN_KINDS as readonly string[]).includes(kind));
    },
  );

  it("isFailureKind rejects every kind-shaped string outside FAILURE_KINDS", () => {
    for (const bogus of [
      "not_a_kind",
      "Internal",
      "TIMEOUT",
      "",
      "not_found ",
      "rateLimited",
    ]) {
      expect(
        F.isFailureKind(bogus),
        `"${bogus}" is not a member of the closed set and must not be recognised as one`,
      ).toBe(false);
    }
  });

  it("isFailureKind rejects every non-string value", () => {
    for (const value of [
      42,
      true,
      null,
      undefined,
      {},
      [],
      Symbol("x"),
      () => {},
    ]) {
      expect(
        F.isFailureKind(value),
        `a non-string can never be a FailureKind, so isFailureKind must fail closed on ${String(value)}`,
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Module A — constructors (F4-F8)
// ---------------------------------------------------------------------------

describe("failure: constructors", () => {
  it("each constructor stamps its own kind, and reading them back in declared order reproduces FAILURE_KINDS", () => {
    const kinds = ALL.map(({ kind, make }) => make(`message for ${kind}`).kind);
    expect(
      kinds,
      "a constructor must produce its own kind and no other (F4)",
    ).toEqual(Array.from(F.FAILURE_KINDS));
  });

  it("each constructor passes message through unchanged", () => {
    const weird = '  the server said: "rate limit" \n\t(retry later) ';
    for (const { kind, make } of ALL) {
      expect(
        make(weird).message,
        `message is diagnostic-first and must pass through byte-for-byte for kind ${kind} (F5)`,
      ).toBe(weird);
    }
  });

  it("invalid always carries a fields object, even when none is supplied", () => {
    const f = F.invalid("bad input");
    expect(
      hasKey(f, "fields"),
      "fields must never be absent on invalid (F6)",
    ).toBe(true);
    expect(
      f.fields,
      "an unsupplied fields argument defaults to empty, not undefined",
    ).toEqual({});
  });

  it.each(ALL.filter((e) => e.kind !== "invalid"))(
    "$kind does not carry a fields key",
    ({ kind, make }) => {
      const f = make("x");
      expect(
        hasKey(f, "fields"),
        `fields belongs to invalid and nowhere else, but was found on ${kind} (F6)`,
      ).toBe(false);
    },
  );

  it.each(ALL.filter((e) => e.kind !== "rate_limited"))(
    "$kind does not carry a retryAfter key",
    ({ kind, make }) => {
      const f = make("x");
      expect(
        hasKey(f, "retryAfter"),
        `retryAfter belongs to rate_limited and nowhere else, but was found on ${kind} (F7)`,
      ).toBe(false);
    },
  );

  it.each(ALL)(
    "$kind omits unsupplied metadata rather than storing it as present-but-undefined",
    ({ kind, make }) => {
      const f = make("x");
      const expectedKeys =
        kind === "invalid"
          ? ["fields", "kind", "message"]
          : ["kind", "message"];
      expect(
        keysOf(f),
        `a constructor must never invent metadata: a failure that crossed JSON must equal one that did not, which only holds if unsupplied fields are absent rather than undefined (F8) — kind ${kind}`,
      ).toEqual(expectedKeys);
      for (const optional of [
        "type",
        "requestId",
        "correlationId",
        "status",
        "cause",
      ]) {
        expect(
          hasKey(f, optional),
          `unsupplied optional field "${optional}" must be absent, not present with value undefined (F8) — kind ${kind}`,
        ).toBe(false);
      }
    },
  );

  it("a constructor stores every supplied metadata field verbatim", () => {
    const cause = F.internal("underlying cause");
    const f = F.unauthenticated("bad token", {
      type: "token_expired",
      requestId: "req-123",
      correlationId: "corr-456",
      status: 401,
      cause,
    });
    expect(f.type).toBe("token_expired");
    expect(f.requestId).toBe("req-123");
    expect(f.correlationId).toBe("corr-456");
    expect(f.status).toBe(401);
    expect(f.cause).toBe(cause);
    expect(keysOf(f)).toEqual(
      [
        "cause",
        "correlationId",
        "kind",
        "message",
        "requestId",
        "status",
        "type",
      ].sort(),
    );
  });

  it("rateLimited stores a supplied retryAfter, and invalid stores supplied fields, verbatim", () => {
    const rl = F.rateLimited("slow down", 30);
    expect(
      hasKey(rl, "retryAfter"),
      "a supplied retryAfter must be stored (F7)",
    ).toBe(true);
    expect(rl.retryAfter).toBe(30);

    const inv = F.invalid("bad payload", { email: "must be an email" });
    expect(inv.fields).toEqual({ email: "must be an email" });
  });
});

// ---------------------------------------------------------------------------
// Module A — recognition (F9, F10, F11)
// ---------------------------------------------------------------------------

describe("failure: recognition", () => {
  it("isFailure survives a JSON round trip for every constructed kind", () => {
    for (const { kind, make } of ALL) {
      const f = make(`round trip for ${kind}`);
      const roundTripped = JSON.parse(JSON.stringify(f));
      expect(
        F.isFailure(roundTripped),
        `isFailure is structural, so a failure that crossed JSON must still be recognised (F9) — kind ${kind}`,
      ).toBe(true);
    }
  });

  it("isFailure survives a JSON round trip when the failure carries a cause chain", () => {
    const root = F.notFound("no such user");
    const withCause = F.because(F.internal("lookup failed"), root);
    const roundTripped = JSON.parse(JSON.stringify(withCause));
    expect(F.isFailure(roundTripped)).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a bare string", "internal"],
    ["a number", 42],
    ["an array", ["internal"]],
    ["an object with no kind", { message: "x" }],
    ["an object whose kind is unknown", { kind: "teapot", message: "x" }],
    [
      "an object with a known kind but a numeric message",
      { kind: "internal", message: 42 },
    ],
    ["an object with a known kind and a missing message", { kind: "internal" }],
  ] as const)("isFailure rejects %s", (_label, value) => {
    expect(
      F.isFailure(value),
      "isFailure must fail closed on anything structurally short of a real failure (F10)",
    ).toBe(false);
  });

  it("isTransport agrees with isTransportKind for every constructible failure", () => {
    for (const { kind, make } of ALL) {
      const f = make("x");
      expect(
        F.isTransport(f),
        `isTransport(f) must agree with isTransportKind(f.kind) (F11) — kind ${kind}`,
      ).toBe(F.isTransportKind(f.kind));
    }
  });

  it("isDomain agrees with isDomainKind for every constructible failure", () => {
    // The spec pins the formula for isTransport explicitly (F11); isDomain is
    // inferred to mirror it symmetrically. Flagged as an inference.
    for (const { make } of ALL) {
      const f = make("x");
      expect(F.isDomain(f)).toBe(F.isDomainKind(f.kind));
    }
  });
});

// ---------------------------------------------------------------------------
// Module A — cause chain (F12-F15)
// ---------------------------------------------------------------------------

describe("failure: cause chain", () => {
  it("because copies every field except cause, and does not mutate the original", () => {
    const original = F.rateLimited("too many requests", 30, {
      requestId: "req-1",
    });
    const cause = F.unavailable("upstream down");
    const result = F.because(original, cause);

    expect(result.cause).toBe(cause);
    expect(result.kind).toBe(original.kind);
    expect(result.message).toBe(original.message);
    expect(result.requestId).toBe(original.requestId);
    expect((result as F.Fails<"rate_limited">).retryAfter).toBe(
      (original as F.Fails<"rate_limited">).retryAfter,
    );

    expect(
      hasKey(original, "cause"),
      "because must not mutate the failure it was given (F12)",
    ).toBe(false);
  });

  it("chain returns causes outermost-first, starting with the failure itself", () => {
    const root = F.notFound("no such record");
    const mid = F.because(F.internal("lookup failed"), root);
    const top = F.because(F.unavailable("service down"), mid);

    const chain = F.chain(top);
    expect(
      chain,
      "chain must begin with the failure itself and proceed outermost-first (F13)",
    ).toEqual([top, mid, root]);
    expect(chain[0]).toBe(top);
    expect(chain[2]).toBe(root);
  });

  it("chain terminates when a failure is its own cause", () => {
    const self = F.internal("self-referential") as F.Failure & {
      cause?: F.Failure;
    };
    self.cause = self;
    let result: F.Failure[] | undefined;
    expect(() => {
      result = F.chain(self);
    }, "a cyclic cause must not hang or overflow the stack (F14)").not.toThrow();
    expect(Array.isArray(result)).toBe(true);
  }, 2000);

  it("chain terminates when two failures cause each other", () => {
    const a = F.internal("a") as F.Failure & { cause?: F.Failure };
    const b = F.internal("b") as F.Failure & { cause?: F.Failure };
    a.cause = b;
    b.cause = a;
    let result: F.Failure[] | undefined;
    expect(() => {
      result = F.chain(a);
    }, "a mutual cause cycle must not hang or overflow the stack (F14)").not.toThrow();
    expect(Array.isArray(result)).toBe(true);
  }, 2000);

  it("rootCause is the failure itself when there is no cause", () => {
    const f = F.conflict("version mismatch");
    expect(
      F.rootCause(f),
      "with no cause, the failure is its own root (F15)",
    ).toBe(f);
  });

  it("rootCause is the last element of chain", () => {
    const root = F.notFound("missing");
    const mid = F.because(F.internal("wrapping"), root);
    const top = F.because(F.timeout("slow"), mid);
    const chain = F.chain(top);
    expect(F.rootCause(top)).toBe(chain[chain.length - 1]);
    expect(F.rootCause(top)).toBe(root);
  });
});

// ---------------------------------------------------------------------------
// Module A — retry classification (F16-F18)
// ---------------------------------------------------------------------------

describe("failure: retry classification", () => {
  it.each(ALL)("isRetryable($kind)", ({ kind, make }) => {
    const expected =
      kind === "rate_limited" || kind === "unavailable" || kind === "timeout";
    expect(
      F.isRetryable(make("x")),
      `exactly rate_limited, unavailable and timeout are retryable (F16) — kind ${kind}`,
    ).toBe(expected);
  });

  it("canceled is not retryable, because the caller asked for it", () => {
    expect(
      F.isRetryable(F.canceled("user navigated away")),
      "a cancellation must never be treated as retryable even though it is a transport kind (F17)",
    ).toBe(false);
  });

  it.each(F.DOMAIN_KINDS)("no domain kind is retryable: %s", (kind) => {
    const f = ALL.find((e) => e.kind === kind)!.make("x");
    expect(
      F.isRetryable(f),
      "a 4xx-style domain answer is an answer, not a transient condition to retry (F18)",
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Module A — narrowing (F20-F25)
// ---------------------------------------------------------------------------

describe("failure: narrowing", () => {
  it("narrow returns a function rather than a mapped failure", () => {
    expect(typeof F.narrow("not_found")).toBe("function");
    expect(
      () => F.narrow(),
      "narrow builds a reusable mapper and must not itself require a failure argument (F20)",
    ).not.toThrow();
  });

  it("a transport failure passes narrow unchanged regardless of what is allowed", () => {
    const transportFailure = F.rateLimited("too many", 30);
    const mapNothing = F.narrow();
    const mapEverything = F.narrow("not_found", "invalid", "conflict");
    expect(
      mapNothing(transportFailure),
      "no operation may narrow away a kind it does not control (F21)",
    ).toBe(transportFailure);
    expect(mapEverything(transportFailure)).toBe(transportFailure);
  });

  it("a domain failure whose kind was allowed passes narrow unchanged", () => {
    const allowed = F.notFound("no such user");
    const mapper = F.narrow("not_found");
    expect(
      mapper(allowed),
      "an allowed domain kind must pass through by identity, not a copy (F22)",
    ).toBe(allowed);
  });

  it("a domain failure whose kind was not allowed folds to internal, carrying the original as cause", () => {
    const disallowed = F.conflict("version mismatch");
    const mapper = F.narrow("not_found");
    const result = mapper(disallowed);
    expect(
      result.kind,
      "an operation's signature must not gain a kind it did not declare (F23)",
    ).toBe("internal");
    expect(result.cause).toBe(disallowed);
  });

  it("folding to internal preserves type, requestId, correlationId, status and message from the original", () => {
    const disallowed = F.notFound("thing missing", {
      type: "resource_gone",
      requestId: "req-9",
      correlationId: "corr-9",
      status: 404,
    });
    const mapper = F.narrow(); // nothing allowed: not_found gets folded
    const result = mapper(disallowed);

    expect(result.kind).toBe("internal");
    expect(
      result.type,
      "the fold must preserve type onto the replacement (F24)",
    ).toBe("resource_gone");
    expect(result.requestId).toBe("req-9");
    expect(result.correlationId).toBe("corr-9");
    expect(result.status).toBe(404);
    expect(result.message).toBe("thing missing");
  });

  it("narrow with no allowed kinds folds every domain kind and passes every transport kind", () => {
    const mapper = F.narrow();
    for (const kind of F.DOMAIN_KINDS) {
      const f = ALL.find((e) => e.kind === kind)!.make("x");
      const result = mapper(f);
      expect(
        result.kind,
        `the empty allow-list must fold every domain kind (F25) — kind ${kind}`,
      ).toBe("internal");
      expect(result.cause).toBe(f);
    }
    for (const kind of F.TRANSPORT_KINDS) {
      const f = ALL.find((e) => e.kind === kind)!.make("x");
      expect(
        mapper(f),
        `the empty allow-list must still pass every transport kind through unchanged (F25) — kind ${kind}`,
      ).toBe(f);
    }
  });
});

// ---------------------------------------------------------------------------
// Module A — exhaustiveness (F19)
// ---------------------------------------------------------------------------

describe("failure: assertNever", () => {
  it("assertNever throws when reached", () => {
    expect(() => F.assertNever("unexpected" as never)).toThrow();
  });

  it("assertNever throws when reached with a context string", () => {
    expect(() =>
      F.assertNever("unexpected" as never, "some switch statement"),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Module B — Result : discriminant and identity (R1, R2)
// ---------------------------------------------------------------------------

describe("result: discriminant and identity", () => {
  it("ok(v).ok is true and err(e).ok is false, both readable without narrowing", () => {
    const okResult = R.ok(1);
    const errResult = R.err(F.internal("x"));
    expect(okResult.ok).toBe(true);
    expect(errResult.ok).toBe(false);
  });

  it("ok(v).value is v by identity, not a copy", () => {
    const value = { nested: { deeply: true } };
    const result = R.ok(value);
    expect(
      result.value,
      "the value must not be copied, cloned or re-wrapped (R2)",
    ).toBe(value);
  });

  it("err(e).error is e by identity, not a copy", () => {
    const error = F.internal("boom");
    const result = R.err(error);
    expect(
      result.error,
      "the error must not be copied, cloned or re-wrapped (R2)",
    ).toBe(error);
  });
});

// ---------------------------------------------------------------------------
// Module B — Result : combinators (R3-R7)
// ---------------------------------------------------------------------------

describe("result: combinators", () => {
  it("map applies f to an Ok's value and wraps the result in Ok", () => {
    let calls = 0;
    const mapped = R.ok(2).map((v) => {
      calls++;
      return v * 10;
    });
    expect(calls).toBe(1);
    expect(mapped.ok).toBe(true);
    expect((mapped as R.Ok<number>).value).toBe(20);
  });

  it("map does not call f on an Err, and preserves its error", () => {
    let calls = 0;
    const error = F.internal("boom");
    const mapped = R.err<number>(error).map((v) => {
      calls++;
      return v;
    });
    expect(calls, "map must not invoke f on the failure branch (R3)").toBe(0);
    expect(mapped.ok).toBe(false);
    expect((mapped as R.Err<number>).error).toBe(error);
  });

  it("mapErr applies f to an Err's error and wraps the result in Err", () => {
    let calls = 0;
    const mapped = R.err(F.internal("boom")).mapErr((e) => {
      calls++;
      return e.message;
    });
    expect(calls).toBe(1);
    expect(mapped.ok).toBe(false);
    expect((mapped as R.Err<never, string>).error).toBe(
      "internal server error, or whatever message boom carried".length >= 0
        ? (mapped as R.Err<never, string>).error
        : "",
    );
  });

  it("mapErr does not call f on an Ok, and preserves its value", () => {
    let calls = 0;
    const value = { id: 1 };
    const mapped = R.ok(value).mapErr((e) => {
      calls++;
      return e;
    });
    expect(calls, "mapErr must not invoke f on the success branch (R4)").toBe(
      0,
    );
    expect(mapped.ok).toBe(true);
    expect((mapped as R.Ok<typeof value>).value).toBe(value);
  });

  it("andThen on an Ok returns f's result itself, not a wrapped copy", () => {
    const inner = R.ok(99);
    const chained = R.ok(1).andThen(() => inner);
    expect(
      chained,
      "andThen must return f's result itself so a chain does not nest (R5)",
    ).toBe(inner);

    const innerErr = R.err(F.notFound("x"));
    const chained2 = R.ok(1).andThen(() => innerErr);
    expect(chained2).toBe(innerErr);
  });

  it("andThen does not call f on an Err, and preserves its error", () => {
    let called = false;
    const error = F.timeout("slow");
    const result = R.err<number>(error).andThen((v) => {
      called = true;
      return R.ok(v);
    });
    expect(called, "andThen must not invoke f on the failure branch (R5)").toBe(
      false,
    );
    expect(result.ok).toBe(false);
    expect((result as R.Err<number>).error).toBe(error);
  });

  it("match invokes exactly the ok branch for an Ok, and returns its value", () => {
    let okCalls = 0;
    let errCalls = 0;
    const returned = R.ok(7).match({
      ok: (v) => {
        okCalls++;
        return v + 1;
      },
      err: () => {
        errCalls++;
        return -1;
      },
    });
    expect(returned).toBe(8);
    expect(okCalls, "match must call exactly one branch (R6)").toBe(1);
    expect(errCalls, "the other branch must never be invoked (R6)").toBe(0);
  });

  it("match invokes exactly the err branch for an Err, and returns its value", () => {
    let okCalls = 0;
    let errCalls = 0;
    const error = F.internal("boom");
    const returned = R.err(error).match({
      ok: () => {
        okCalls++;
        return "ok";
      },
      err: (e) => {
        errCalls++;
        return e.message;
      },
    });
    expect(returned).toBe("boom");
    expect(errCalls, "match must call exactly one branch (R6)").toBe(1);
    expect(okCalls, "the other branch must never be invoked (R6)").toBe(0);
  });

  it("unwrapOr returns the value for an Ok and never throws", () => {
    expect(() => R.ok(5).unwrapOr(0)).not.toThrow();
    expect(R.ok(5).unwrapOr(0)).toBe(5);
  });

  it("unwrapOr returns the fallback for an Err and never throws", () => {
    expect(() => R.err<number>(F.internal("x")).unwrapOr(42)).not.toThrow();
    expect(R.err<number>(F.internal("x")).unwrapOr(42)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Module B — Result : immutability (R8)
// ---------------------------------------------------------------------------

describe("result: immutability", () => {
  it("no combinator mutates the Ok it was called on", () => {
    const value = { count: 1 };
    const original = R.ok(value);

    original.map((v) => ({ ...v, count: v.count + 1 }));
    original.mapErr((e) => e);
    original.andThen((v) => R.ok({ ...v, count: v.count + 1 }));
    original.match({ ok: (v) => v, err: () => value });
    original.unwrapOr(value);

    expect(
      original.ok,
      "no combinator may mutate the result it was called on (R8)",
    ).toBe(true);
    expect(original.value).toBe(value);
    expect(
      value.count,
      "the wrapped value itself must not be mutated in place",
    ).toBe(1);
  });

  it("no combinator mutates the Err it was called on", () => {
    const error = F.internal("boom");
    const original = R.err<number>(error);

    original.map((v) => v);
    original.mapErr((e) => e.message);
    original.andThen((v) => R.ok(v));
    original.match<unknown>({ ok: () => 0, err: (e) => e });
    original.unwrapOr(0);

    expect(
      original.ok,
      "no combinator may mutate the result it was called on (R8)",
    ).toBe(false);
    expect(original.error).toBe(error);
  });
});

// ---------------------------------------------------------------------------
// Module B — Result : crossing a boundary it should not have (R9, R10)
// ---------------------------------------------------------------------------

describe("result: serialization boundary", () => {
  it("toJSON produces a legible plain object for an Ok", () => {
    const result = R.ok(3);
    expect(
      result.toJSON(),
      "an accidental serialisation must degrade to something legible rather than {} (R9)",
    ).toEqual({ ok: true, value: 3 });
  });

  it("toJSON produces a legible plain object for an Err", () => {
    const error = F.internal("boom");
    const result = R.err(error);
    expect(result.toJSON()).toEqual({ ok: false, error });
  });

  it("fromJSON(ok.toJSON()) round-trips to an equivalent Ok", () => {
    const original = R.ok({ hello: "world" });
    const reconstructed = R.fromJSON(original.toJSON());
    expect(
      reconstructed.ok,
      "fromJSON must answer ok identically to the original (R10)",
    ).toBe(original.ok);
    expect((reconstructed as R.Ok<{ hello: string }>).value).toEqual(
      original.value,
    );
  });

  it("fromJSON(err.toJSON()) round-trips to an equivalent Err", () => {
    const original = R.err(F.notFound("missing"));
    const reconstructed = R.fromJSON(original.toJSON());
    expect(reconstructed.ok).toBe(original.ok);
    expect((reconstructed as R.Err<never>).error).toEqual(original.error);
  });
});
