/* Imported regression suite from flover-next/lib/http/failure-model.spec.test.ts.
 * The original writer's barrier and mutation evidence belong to that sibling's
 * custody/evidence/0001. This port was prepared with implementation access and
 * is not a new blind writer run. Assertions retain the source suite's contract;
 * the two inherited skips keep their original TRIAGED explanations below.
 * Local historical Svelte custody records describe separate runs and are kept
 * unchanged. See docs/port-parity.md for the scope of current verification. */
import { describe, expect, it, vi } from "vitest";

import {
  unauthenticated,
  forbidden,
  notFound,
  conflict,
  unavailable,
  timeout,
  canceled,
  internal,
  invalid,
  rateLimited,
  TRANSPORT_KINDS,
  DOMAIN_KINDS,
  FAILURE_KINDS,
  isFailureKind,
  isTransportKind,
  isDomainKind,
  isFailure,
  isTransport,
  isRetryable,
  retryDelay,
  because,
  chain,
  rootCause,
  narrow,
  assertNever,
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
} from "../kernel";
import type { Failure, FailureKind } from "../kernel";

import { createFetchClient, createMemoryClient, requireToken } from ".";

// One constructed instance per kind, reused across guard/retry/narrow tests
// so those sections don't each re-derive their own fixtures.
const sampleFailure: Record<FailureKind, Failure> = {
  unauthenticated: unauthenticated("no credential"),
  forbidden: forbidden("not permitted"),
  rate_limited: rateLimited("slow down"),
  unavailable: unavailable("unreachable"),
  timeout: timeout("too slow"),
  canceled: canceled("stopped"),
  internal: internal("ours, or nobody's"),
  not_found: notFound("missing"),
  invalid: invalid("bad request", { field: "required" }),
  conflict: conflict("moved underneath the caller"),
};

// ---------------------------------------------------------------------------
// 1 · What a failure is / 2 · The ten kinds, and the split
// ---------------------------------------------------------------------------

describe("2 · the ten kinds, and the split", () => {
  it("has exactly seven transport kinds, in the order the contract lists them", () => {
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

  it("has exactly three domain kinds, in the order the contract lists them", () => {
    expect(DOMAIN_KINDS).toEqual(["not_found", "invalid", "conflict"]);
  });

  it("FAILURE_KINDS is the transport kinds followed by the domain kinds", () => {
    expect(FAILURE_KINDS).toEqual([...TRANSPORT_KINDS, ...DOMAIN_KINDS]);
    expect(FAILURE_KINDS).toHaveLength(10);
  });

  it("transport and domain kinds partition the ten kinds with no overlap", () => {
    const overlap = TRANSPORT_KINDS.filter((k) =>
      (DOMAIN_KINDS as readonly string[]).includes(k),
    );
    expect(overlap).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3 · Constructors
// ---------------------------------------------------------------------------

describe("3 · constructors", () => {
  const plainConstructors: Array<
    [string, (message: string, meta?: any) => Failure, FailureKind]
  > = [
    ["unauthenticated", unauthenticated, "unauthenticated"],
    ["forbidden", forbidden, "forbidden"],
    ["notFound", notFound, "not_found"],
    ["conflict", conflict, "conflict"],
    ["unavailable", unavailable, "unavailable"],
    ["timeout", timeout, "timeout"],
    ["canceled", canceled, "canceled"],
    ["internal", internal, "internal"],
  ];

  describe.each(plainConstructors)("%s()", (_name, ctor, kind) => {
    it(`produces a plain ${kind} failure carrying only message, and no fields/retryAfter`, () => {
      const f = ctor("something happened");
      expect(f.kind).toBe(kind);
      expect(f.message).toBe("something happened");
      expect((f as any).fields).toBeUndefined();
      expect((f as any).retryAfter).toBeUndefined();
    });

    it("applies optional meta (type, requestId, status, cause) verbatim", () => {
      const cause = internal("root");
      const f = ctor("boom", {
        type: "custom",
        requestId: "req-1",
        status: 418,
        cause,
      });
      expect(f.type).toBe("custom");
      expect(f.requestId).toBe("req-1");
      expect(f.status).toBe(418);
      expect(f.cause).toBe(cause);
    });
  });

  describe("invalid()", () => {
    it("requires and carries the fields record", () => {
      const f = invalid("validation failed", {
        email: "must be a valid email",
        age: "must be a number",
      });
      expect(f.kind).toBe("invalid");
      expect(f.message).toBe("validation failed");
      expect(f.fields).toEqual({
        email: "must be a valid email",
        age: "must be a number",
      });
    });

    it("accepts an empty fields object", () => {
      const f = invalid("validation failed", {});
      expect(f.fields).toEqual({});
    });

    it("never carries retryAfter", () => {
      expect((invalid("x", {}) as any).retryAfter).toBeUndefined();
    });
  });

  describe("rateLimited()", () => {
    it("makes retryAfter optional", () => {
      const f = rateLimited("slow down");
      expect(f.kind).toBe("rate_limited");
      expect(f.retryAfter).toBeUndefined();
    });

    it("carries retryAfter (seconds) when given", () => {
      expect(rateLimited("slow down", 30).retryAfter).toBe(30);
    });

    it("never carries fields", () => {
      expect((rateLimited("slow down", 30) as any).fields).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// 4 · Guards
// ---------------------------------------------------------------------------

describe("4 · guards", () => {
  describe("isFailureKind", () => {
    it("is true for exactly the ten kind strings", () => {
      for (const kind of FAILURE_KINDS) {
        expect(isFailureKind(kind)).toBe(true);
      }
    });

    it.each([
      "bogus",
      "",
      "NOT_FOUND",
      "notfound",
      123,
      null,
      undefined,
      {},
      [],
    ])("is false for %p", (v) => {
      expect(isFailureKind(v as any)).toBe(false);
    });
  });

  describe("isTransportKind / isDomainKind", () => {
    it("agree with TRANSPORT_KINDS / DOMAIN_KINDS membership for every kind", () => {
      for (const kind of FAILURE_KINDS) {
        expect(isTransportKind(kind)).toBe(
          (TRANSPORT_KINDS as readonly string[]).includes(kind),
        );
        expect(isDomainKind(kind)).toBe(
          (DOMAIN_KINDS as readonly string[]).includes(kind),
        );
      }
    });

    it("are both false for a non-kind value", () => {
      expect(isTransportKind("bogus")).toBe(false);
      expect(isDomainKind("bogus")).toBe(false);
    });
  });

  describe("isFailure", () => {
    it("is true for a constructed failure of every kind", () => {
      for (const kind of FAILURE_KINDS) {
        expect(isFailure(sampleFailure[kind])).toBe(true);
      }
    });

    it("survives a JSON round trip", () => {
      const revived = JSON.parse(JSON.stringify(sampleFailure.not_found));
      expect(isFailure(revived)).toBe(true);
    });

    it("is false for a plain Error, even though Error also carries a string message", () => {
      expect(isFailure(new Error("plain error"))).toBe(false);
    });

    it("is false for a string", () => {
      expect(isFailure("not_found")).toBe(false);
    });

    it("is false for null and undefined", () => {
      expect(isFailure(null)).toBe(false);
      expect(isFailure(undefined)).toBe(false);
    });

    it("is false for an object whose kind is not one of the ten", () => {
      expect(isFailure({ kind: "teapot", message: "I am a teapot" })).toBe(
        false,
      );
    });

    it("is false for an object with a valid kind but no string message", () => {
      expect(isFailure({ kind: "internal" })).toBe(false);
    });
  });

  describe("isTransport", () => {
    it("is true for every transport kind and false for every domain kind", () => {
      for (const kind of TRANSPORT_KINDS) {
        expect(isTransport(sampleFailure[kind])).toBe(true);
      }
      for (const kind of DOMAIN_KINDS) {
        expect(isTransport(sampleFailure[kind])).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 5 · Retry
// ---------------------------------------------------------------------------

describe("5 · retry", () => {
  describe("isRetryable", () => {
    it("is true for exactly rate_limited, unavailable and timeout", () => {
      for (const kind of FAILURE_KINDS) {
        const expected =
          kind === "rate_limited" ||
          kind === "unavailable" ||
          kind === "timeout";
        expect(isRetryable(sampleFailure[kind])).toBe(expected);
      }
    });

    it("is false for canceled specifically — a cancellation was asked for, and a refusal is an answer", () => {
      expect(isRetryable(sampleFailure.canceled)).toBe(false);
    });
  });

  describe("retryDelay", () => {
    it("is null for every non-retryable kind", () => {
      for (const kind of FAILURE_KINDS) {
        if (
          kind === "rate_limited" ||
          kind === "unavailable" ||
          kind === "timeout"
        )
          continue;
        expect(retryDelay(sampleFailure[kind], 0)).toBeNull();
      }
    });

    it("uses retryAfter, converted from seconds to milliseconds, for rate_limited when present", () => {
      expect(retryDelay(rateLimited("slow down", 5), 0)).toBe(5000);
    });

    it("holds the retryAfter-derived delay constant across attempts", () => {
      const f = rateLimited("slow down", 5);
      expect(retryDelay(f, 0)).toBe(5000);
      expect(retryDelay(f, 4)).toBe(5000);
    });

    // AMBIGUOUS: the contract states the exponential formula immediately after describing
    // rate_limited's retryAfter rule ("Otherwise exponential..."), which we read as also
    // covering a rate_limited failure that carries no retryAfter. The contract does not
    // restate this case explicitly.
    it("falls back to the exponential schedule when rate_limited carries no retryAfter", () => {
      expect(retryDelay(rateLimited("slow down"), 0)).toBe(250);
    });

    it("doubles from 250ms per attempt, capped at 8000ms, for unavailable", () => {
      const f = unavailable("could not reach the server");
      const expected = [250, 500, 1000, 2000, 4000, 8000, 8000, 8000];
      expected.forEach((ms, attempt) => {
        expect(retryDelay(f, attempt)).toBe(ms);
      });
    });

    it("doubles from 250ms per attempt, capped at 8000ms, for timeout", () => {
      const f = timeout("the server took too long");
      const expected = [250, 500, 1000, 2000, 4000, 8000];
      expected.forEach((ms, attempt) => {
        expect(retryDelay(f, attempt)).toBe(ms);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// 6 · Cause chain
// ---------------------------------------------------------------------------

describe("6 · cause chain", () => {
  describe("because()", () => {
    it("returns a copy carrying the cause, and does not modify the original", () => {
      const original = notFound("missing");
      const cause = internal("nested reason");
      const withCause = because(original, cause);
      expect(withCause.cause).toBe(cause);
      expect(original.cause).toBeUndefined();
    });

    it("keeps the outer failure's own kind", () => {
      const original = conflict("state moved");
      const withCause = because(original, internal("underlying"));
      expect(withCause.kind).toBe("conflict");
    });
  });

  describe("chain()", () => {
    it("is a single-element chain when there is no cause", () => {
      const f = internal("alone");
      expect(chain(f)).toEqual([f]);
    });

    it("lists failures outermost-first, following cause", () => {
      const root = internal("root cause");
      const mid = because(conflict("state moved"), root);
      const outer = because(unauthenticated("no credential"), mid);
      expect(chain(outer)).toEqual([outer, mid, root]);
    });

    it("terminates instead of looping forever on a cyclic cause", () => {
      const cyclic = notFound("cyclic") as Failure & { cause?: Failure };
      cyclic.cause = cyclic;
      // AMBIGUOUS: the contract requires only termination on a cycle, not a specific
      // resulting length; we assert termination (a finite, non-empty result) and no more.
      const result = chain(cyclic);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(1000);
    });
  });

  describe("rootCause()", () => {
    it("is the failure itself when there is no cause", () => {
      const f = internal("alone");
      expect(rootCause(f)).toBe(f);
    });

    it("is the last entry of the chain when there is one", () => {
      const root = internal("root cause");
      const mid = because(conflict("state moved"), root);
      const outer = because(unauthenticated("no credential"), mid);
      expect(rootCause(outer)).toBe(root);
    });
  });
});

// ---------------------------------------------------------------------------
// 7 · Narrowing
// ---------------------------------------------------------------------------

describe("7 · narrowing", () => {
  it("returns a transport failure unchanged, by identity, no matter which domain kinds are allowed", () => {
    const transportFailure = unavailable("could not reach the server");
    const mapper = narrow("not_found");
    expect(mapper(transportFailure)).toBe(transportFailure);
  });

  it("returns a domain failure unchanged, by identity, when its kind is in the allowed list", () => {
    const allowed = notFound("missing");
    const mapper = narrow("not_found", "conflict");
    expect(mapper(allowed)).toBe(allowed);
  });

  it("turns a domain failure outside the allowed list into internal, carrying the original as cause", () => {
    const original = conflict("stale", {
      type: "version_mismatch",
      requestId: "r-9",
      status: 409,
    });
    const mapper = narrow("not_found");
    const result = mapper(original);
    expect(result.kind).toBe("internal");
    expect(result.cause).toBe(original);
  });

  it("preserves the original's type, requestId and status on the narrowed internal failure", () => {
    const original = invalid(
      "bad body",
      { field: "required" },
      { type: "schema_error", requestId: "r-10", status: 422 },
    );
    const mapper = narrow("conflict");
    const result = mapper(original);
    expect(result.type).toBe("schema_error");
    expect(result.requestId).toBe("r-10");
    expect(result.status).toBe(422);
  });

  it("narrow() with no arguments allows no domain kinds at all", () => {
    const mapper = narrow();
    const result = mapper(notFound("missing"));
    expect(result.kind).toBe("internal");
  });
});

// ---------------------------------------------------------------------------
// 8 · Exhaustiveness
// ---------------------------------------------------------------------------

describe("8 · exhaustiveness", () => {
  it("throws when reached at runtime", () => {
    expect(() => assertNever("unhandled" as never)).toThrow();
  });

  // AMBIGUOUS: the contract does not specify whether or how the optional context argument
  // is surfaced in the thrown error's message; asserting it appears is an inference.
  it("surfaces the optional context in the thrown error's message", () => {
    expect(() =>
      assertNever("unhandled" as never, "switch over failure.kind"),
    ).toThrow(/switch over failure\.kind/);
  });

  // NOTE: assertNever's parameter type being `never` is a compile-time guarantee
  // (a switch that has handled every kind can call it in the default branch, and a new
  // kind becomes a type error). That guarantee is not observable at runtime and is not
  // covered here — there is no type checker in this harness.
});

// ---------------------------------------------------------------------------
// 9 · Result
// ---------------------------------------------------------------------------

describe("9 · Result", () => {
  it("ok() produces {ok: true, value}", () => {
    const r = ok(5);
    expect(r.ok).toBe(true);
    expect((r as any).value).toBe(5);
  });

  it("err() produces {ok: false, error}", () => {
    const failure = internal("boom");
    const r = err(failure);
    expect(r.ok).toBe(false);
    expect((r as any).error).toBe(failure);
  });

  describe("map()", () => {
    it("transforms the value on Ok", () => {
      const result = ok(2).map((v: number) => v * 10);
      expect(result).toEqual({ ok: true, value: 20 });
    });

    it("leaves a failure untouched on Err", () => {
      const failure = internal("boom");
      const f = vi.fn();
      const result = err(failure).map(f);
      expect(f).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe(failure);
    });
  });

  describe("mapErr()", () => {
    it("transforms the error on Err", () => {
      const replacement = notFound("gone");
      const result = err(internal("boom")).mapErr(() => replacement);
      expect(result).toEqual({ ok: false, error: replacement });
    });

    it("leaves a value untouched on Ok", () => {
      const f = vi.fn();
      const result = ok(5).mapErr(f);
      expect(f).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true, value: 5 });
    });
  });

  describe("andThen()", () => {
    it("calls f with the value and returns its Result, on Ok", () => {
      const result = ok(2).andThen((v: number) => ok(v + 1));
      expect(result).toEqual({ ok: true, value: 3 });
    });

    it("returns the failure without calling f, on Err", () => {
      const failure = internal("boom");
      const f = vi.fn();
      const result = err(failure).andThen(f);
      expect(f).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe(failure);
    });
  });

  describe("match()", () => {
    it("calls exactly the ok branch on success and returns its value", () => {
      const errSpy = vi.fn();
      const value = ok(5).match({ ok: (v: number) => v * 2, err: errSpy });
      expect(value).toBe(10);
      expect(errSpy).not.toHaveBeenCalled();
    });

    it("calls exactly the err branch on failure and returns its value", () => {
      const okSpy = vi.fn();
      const failure = internal("boom");
      const value = err(failure).match({
        ok: okSpy,
        err: (e: Failure) => e.message,
      });
      expect(value).toBe("boom");
      expect(okSpy).not.toHaveBeenCalled();
    });
  });

  describe("unwrapOr()", () => {
    it("returns the value on Ok, ignoring the fallback", () => {
      expect(ok(5).unwrapOr(0)).toBe(5);
    });

    it("returns the fallback on Err", () => {
      expect(err(internal("boom")).unwrapOr(0)).toBe(0);
    });
  });

  describe("tapErr()", () => {
    it("calls the function with the error on Err, and returns the same result", () => {
      const failure = internal("boom");
      const original = err(failure);
      const tap = vi.fn();
      const result = original.tapErr(tap);
      expect(tap).toHaveBeenCalledTimes(1);
      expect(tap).toHaveBeenCalledWith(failure);
      expect(result).toBe(original);
    });

    it("does not call the function on Ok, and returns the same result — it must never change what the caller sees", () => {
      const original = ok(5);
      const tap = vi.fn();
      const result = original.tapErr(tap);
      expect(tap).not.toHaveBeenCalled();
      expect(result).toBe(original);
    });
  });

  describe("toJSON()", () => {
    it("is the plain success shape on Ok", () => {
      expect(ok(5).toJSON()).toEqual({ ok: true, value: 5 });
    });

    it("is the plain failure shape on Err", () => {
      const failure = internal("boom");
      expect(err(failure).toJSON()).toEqual({ ok: false, error: failure });
    });
  });

  describe("all()", () => {
    it("collects every value as a tuple, in order, when every result succeeds", () => {
      const result = all([ok(1), ok("two"), ok(3)]);
      expect(result).toEqual({ ok: true, value: [1, "two", 3] });
    });

    it("returns the FIRST failure and ignores any that follow", () => {
      const first = notFound("first missing");
      const second = internal("second boom");
      const result = all([ok(1), err(first), err(second)]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe(first);
    });

    // AMBIGUOUS: the contract does not state the result for an empty input array; treating
    // "every value as a tuple, in order" as vacuously satisfied by an empty tuple.
    it("succeeds with an empty tuple for an empty input", () => {
      expect(all([])).toEqual({ ok: true, value: [] });
    });
  });

  describe("andThenAsync()", () => {
    it("awaits f and its Result, on Ok", async () => {
      const result = await andThenAsync(ok(2), async (v: number) => ok(v + 1));
      expect(result).toEqual({ ok: true, value: 3 });
    });

    it("short-circuits without calling f, on Err", async () => {
      const failure = internal("boom");
      const f = vi.fn();
      const result = await andThenAsync(err(failure), f);
      expect(f).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe(failure);
    });
  });

  describe("fromJSON()", () => {
    it("rebuilds a functioning Ok from its plain shape", () => {
      const rebuilt = fromJSON({ ok: true, value: 5 });
      expect(rebuilt.ok).toBe(true);
      expect(rebuilt.unwrapOr(0)).toBe(5);
      expect(rebuilt.map((v: number) => v * 2).unwrapOr(0)).toBe(10);
    });

    it("rebuilds a functioning Err from its plain shape", () => {
      const failure = internal("boom");
      const rebuilt = fromJSON({ ok: false, error: failure });
      expect(rebuilt.ok).toBe(false);
      expect(rebuilt.unwrapOr(99)).toBe(99);
    });

    it("round-trips: fromJSON(x.toJSON()) behaves the same as x", () => {
      const originalOk = ok(7);
      expect(fromJSON(originalOk.toJSON()).unwrapOr(-1)).toBe(
        originalOk.unwrapOr(-1),
      );

      const originalErr = err(notFound("gone"));
      expect(fromJSON(originalErr.toJSON()).toJSON()).toEqual(
        originalErr.toJSON(),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 10 · Absence is not failure
// ---------------------------------------------------------------------------

describe("10 · absence is not failure", () => {
  describe("optional()", () => {
    it("passes a success through with its value", async () => {
      const result = await optional(ok(42), anyNotFound);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it("passes a non-not_found failure through unchanged", async () => {
      const failure = internal("boom");
      const result = await optional(err(failure), anyNotFound);
      expect(result).toEqual({ ok: false, error: failure });
    });

    it("turns a not_found the predicate accepts as absence into a success of null", async () => {
      const result = await optional(
        err(notFound("no such thing")),
        anyNotFound,
      );
      expect(result).toEqual({ ok: true, value: null });
    });

    it("does not report an unidentified not_found as emptiness — it becomes internal, carrying the original as cause", async () => {
      const original = notFound("no such thing");
      const result = await optional(err(original), () => false);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("internal");
        expect(result.error.cause).toBe(original);
      }
    });
  });

  describe("anyNotFound", () => {
    it("is true for every not_found failure regardless of its other data", () => {
      expect(anyNotFound(notFound("a"))).toBe(true);
      expect(anyNotFound(notFound("b", { type: "whatever" }))).toBe(true);
    });
  });

  describe("absentWhenType()", () => {
    it("is true only when the failure's type matches exactly", () => {
      const predicate = absentWhenType("soft_delete");
      expect(predicate(notFound("gone", { type: "soft_delete" }))).toBe(true);
    });

    it("is false when the type differs", () => {
      const predicate = absentWhenType("soft_delete");
      expect(predicate(notFound("gone", { type: "hard_delete" }))).toBe(false);
    });

    it("is false when the failure carries no type at all", () => {
      const predicate = absentWhenType("soft_delete");
      expect(predicate(notFound("gone"))).toBe(false);
    });
  });

  describe("presenceOf()", () => {
    it("is found for a success with a non-null value", () => {
      expect(presenceOf(ok({ id: 1 }))).toEqual({
        state: "found",
        value: { id: 1 },
      });
    });

    it("is empty for a success whose value is null — the search happened and found nothing", () => {
      expect(presenceOf(ok(null))).toEqual({ state: "empty" });
    });

    it("is unmeasured for a failure — nobody looked, and that is a different fact from emptiness", () => {
      const failure = unavailable("could not reach the server");
      expect(presenceOf(err(failure))).toEqual({
        state: "unmeasured",
        failure,
      });
    });
  });
});

// ---------------------------------------------------------------------------
// 11 · The one throw site
// ---------------------------------------------------------------------------

describe("11 · the one throw site", () => {
  describe("AppError", () => {
    it("is an Error carrying the failure, whose message is the failure's message", () => {
      const failure = internal("something broke");
      const error = new AppError(failure);
      expect(error).toBeInstanceOf(Error);
      expect(error.failure).toBe(failure);
      expect(error.message).toBe("something broke");
    });
  });

  describe("unwrap()", () => {
    it("returns the value on Ok", () => {
      expect(unwrap(ok(5))).toBe(5);
    });

    it("throws an AppError carrying the failure on Err", () => {
      const failure = notFound("missing");
      expect(() => unwrap(err(failure))).toThrow(AppError);
      try {
        unwrap(err(failure));
        expect.unreachable("unwrap on an Err must throw");
      } catch (thrown) {
        expect((thrown as InstanceType<typeof AppError>).failure).toBe(failure);
      }
    });
  });

  describe("asFailure()", () => {
    it("is total: never throws, for any input", () => {
      const inputs: unknown[] = [
        null,
        undefined,
        42,
        "oops",
        {},
        [],
        new Error("plain"),
        new AppError(internal("wrapped")),
      ];
      for (const input of inputs) {
        expect(() => asFailure(input)).not.toThrow();
      }
    });

    it("unwraps an AppError to its own failure", () => {
      const failure = conflict("stale");
      const error = new AppError(failure);
      expect(asFailure(error)).toBe(failure);
    });

    it("returns a value that is already structurally a Failure as-is", () => {
      const alreadyAFailure = { kind: "not_found", message: "gone" };
      expect(asFailure(alreadyAFailure)).toBe(alreadyAFailure);
    });

    it("turns a plain Error into internal, using its message and constructor name as type", () => {
      const result = asFailure(new TypeError("bad input"));
      expect(result.kind).toBe("internal");
      expect(result.message).toBe("bad input");
      expect(result.type).toBe("TypeError");
    });

    it("turns any other value into an internal failure with a string message", () => {
      for (const input of [42, "oops", null, undefined, {}, []]) {
        const result = asFailure(input);
        expect(result.kind).toBe("internal");
        expect(typeof result.message).toBe("string");
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 12 · The transport port
//
// AMBIGUOUS: the contract states HttpClient "exposes request, get, post, put, patch
// and delete", each returning Promise<Result<T, Failure>>, but does not give exact
// call signatures. The calls below assume the conventional REST-wrapper shape:
//   get(path, options?)         delete(path, options?)
//   post(path, body, options?)  put/patch(path, body, options?)
//   options: { signal? }
// If the real signatures differ, failures below may be signature mismatches rather
// than behavioural findings — see the report.
// ---------------------------------------------------------------------------

describe("12 · the transport port", () => {
  describe("decoding a non-2xx response — status-derived kind when there is no usable body", () => {
    const statusMap: Array<[number, FailureKind]> = [
      [400, "invalid"],
      [401, "unauthenticated"],
      [403, "forbidden"],
      [404, "not_found"],
      [409, "conflict"],
      [412, "conflict"],
      [422, "invalid"],
      [428, "invalid"],
      [429, "rate_limited"],
      [499, "canceled"],
      [503, "unavailable"],
      [504, "timeout"],
      [500, "internal"], // anything not in the table
    ];

    statusMap.forEach(([status, kind]) => {
      it(`maps HTTP ${status} with an empty body to ${kind}, and records the status`, async () => {
        vi.stubGlobal("fetch", async () => new Response(null, { status }));
        try {
          const client = createFetchClient({ baseUrl: "https://api.test" });
          const result = await client.get("/resource");
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.kind).toBe(kind);
            expect(result.error.status).toBe(status);
          }
        } finally {
          vi.unstubAllGlobals();
        }
      });
    });

    it("decoding is total: a non-JSON body still produces a failure rather than throwing", async () => {
      vi.stubGlobal(
        "fetch",
        async () => new Response("<html>Error</html>", { status: 500 }),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.kind).toBe("internal");
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("a body-declared kind that IS one of the ten wins over the status", () => {
      return (async () => {
        vi.stubGlobal(
          "fetch",
          async () =>
            new Response(
              JSON.stringify({ kind: "conflict", message: "stale data" }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            ),
        );
        try {
          const client = createFetchClient({ baseUrl: "https://api.test" });
          const result = await client.get("/resource");
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.kind).toBe("conflict");
            expect(result.error.message).toBe("stale data");
            expect(result.error.status).toBe(400); // status is always recorded
          }
        } finally {
          vi.unstubAllGlobals();
        }
      })();
    });

    it("a body-declared kind that is NOT one of the ten falls back to the status, preserving the unknown string as type", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(
            JSON.stringify({ kind: "weird_backend_code", message: "oops" }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            },
          ),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("invalid"); // 400 -> invalid
          expect(result.error.type).toBe("weird_backend_code");
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("collects per-field messages for invalid, ignoring non-string entries", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(
            JSON.stringify({
              kind: "invalid",
              message: "Bad input",
              fields: { name: "required", age: 123, note: "ok" },
            }),
            { status: 422, headers: { "content-type": "application/json" } },
          ),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("invalid");
          expect((result.error as any).fields).toEqual({
            name: "required",
            note: "ok",
          });
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("takes requestId from the body when present", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(
            JSON.stringify({ message: "gone", requestId: "body-rid" }),
            {
              status: 404,
              headers: { "content-type": "application/json" },
            },
          ),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.requestId).toBe("body-rid");
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("falls back to the x-request-id header when the body has no requestId", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(JSON.stringify({ message: "gone" }), {
            status: 404,
            headers: {
              "content-type": "application/json",
              "x-request-id": "hdr-rid",
            },
          }),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.requestId).toBe("hdr-rid");
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("takes retryAfter from the body when present, for rate_limited", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(
            JSON.stringify({ message: "slow down", retryAfter: 42 }),
            {
              status: 429,
              headers: { "content-type": "application/json" },
            },
          ),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) expect((result.error as any).retryAfter).toBe(42);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("falls back to the retry-after header when the body has no retryAfter", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(JSON.stringify({ message: "slow down" }), {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": "17",
            },
          }),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok)
          expect(Number((result.error as any).retryAfter)).toBe(17);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("a failure with no response", () => {
    it("maps caller cancellation to canceled — distinct from and not retryable, unlike timeout", async () => {
      const controller = new AbortController();
      controller.abort();
      vi.stubGlobal("fetch", (_url: string, init?: RequestInit) => {
        if (init?.signal?.aborted) {
          return Promise.reject(new DOMException("Aborted", "AbortError"));
        }
        return new Promise(() => {});
      });
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource", {
          signal: controller.signal,
        } as any);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("canceled");
          expect(isRetryable(result.error)).toBe(false);
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });

    // TRIAGED — SPEC GAP, AMENDED — see custody/evidence/0001/06-amendments. The contract now states the budget is settable per client and per request and that it defaults to 15s. This test predates that amendment and cannot pass as written: with no `timeoutMs` it outlives the runner's own 5s limit. The ASSERTION is correct. A future barriered run against the amended contract would produce a passing version; hand-editing this one against the implementation is what the barrier exists to prevent.
    it.skip("maps exceeding its own time budget to timeout — distinct from cancellation, and retryable", async () => {
      vi.stubGlobal("fetch", () => new Promise(() => {})); // never settles
      try {
        const client = createFetchClient({
          baseUrl: "https://api.test",
          timeoutMs: 20,
        });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("timeout");
          expect(isRetryable(result.error)).toBe(true);
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("maps a dropped socket / DNS-style failure to unavailable", async () => {
      vi.stubGlobal("fetch", () =>
        Promise.reject(new TypeError("Failed to fetch")),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.kind).toBe("unavailable");
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("never throws, even when fetch itself throws synchronously", async () => {
      vi.stubGlobal("fetch", () => {
        throw new Error("boom");
      });
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        await expect(client.get("/resource")).resolves.toMatchObject({
          ok: false,
        });
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("a 2xx response", () => {
    it("a 204 succeeds with no value", async () => {
      vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(true);
        // AMBIGUOUS: "succeeds with no value" is read as `value === undefined`;
        // the contract does not rule out `null` instead.
        if (result.ok) expect(result.value).toBeUndefined();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("a body that cannot be read as JSON on an otherwise successful response is internal, not retryable — a broken contract, not a broken network", async () => {
      vi.stubGlobal(
        "fetch",
        async () => new Response("not-json{{{", { status: 200 }),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/resource");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("internal");
          expect(isRetryable(result.error)).toBe(false);
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("resolves the parsed JSON body as the value on success", async () => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(JSON.stringify({ id: 1, name: "widget" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      );
      try {
        const client = createFetchClient({ baseUrl: "https://api.test" });
        const result = await client.get("/things/1");
        expect(result).toEqual({ ok: true, value: { id: 1, name: "widget" } });
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("the in-memory adapter", () => {
    it("dispatches a matching route and returns its Result untouched", async () => {
      const client = createMemoryClient({
        routes: [
          {
            method: "GET",
            pattern: /^\/widgets\/(\w+)$/,
            handle: (request: any, match: RegExpMatchArray) =>
              ok({ id: match[1], path: request.path, method: request.method }),
          },
        ],
      });
      const result = await client.get("/widgets/abc");
      expect(result).toEqual({
        ok: true,
        value: { id: "abc", path: "/widgets/abc", method: "GET" },
      });
    });

    it("forwards the request body to the matching route's handler", async () => {
      const client = createMemoryClient({
        routes: [
          {
            method: "POST",
            pattern: /^\/widgets$/,
            handle: (request: any) => ok(request.body),
          },
        ],
      });
      const result = await client.post("/widgets", {
        body: { name: "gadget" },
      });
      expect(result).toEqual({ ok: true, value: { name: "gadget" } });
    });

    it("a route may return any failure, indistinguishable from a real one to the caller", async () => {
      const client = createMemoryClient({
        routes: [
          {
            method: "GET",
            pattern: /^\/widgets\/missing$/,
            handle: () => err(notFound("no such widget")),
          },
        ],
      });
      const result = await client.get("/widgets/missing");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("not_found");
    });

    it("an unmatched route is a fixture fault, and must produce internal — never not_found, which would claim the server spoke", async () => {
      const client = createMemoryClient({ routes: [] });
      const result = await client.get("/does-not-exist");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("internal");
    });

    it("a request whose signal is already aborted produces canceled", async () => {
      const controller = new AbortController();
      controller.abort();
      const client = createMemoryClient({
        routes: [
          {
            method: "GET",
            pattern: /^\/x$/,
            handle: () => ok("should not matter"),
          },
        ],
      });
      const result = await client.get("/x", {
        signal: controller.signal,
      } as any);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("canceled");
    });

    // The memory route's request object exposes `token`, resolved via getAccessToken —
    // this is stated directly in this task's description of the route/request shape.
    it("forwards the resolved access token onto the request handed to a route", async () => {
      const client = createMemoryClient({
        routes: [
          {
            method: "GET",
            pattern: /^\/me$/,
            handle: (request: any) => ok(request.token),
          },
        ],
        getAccessToken: () => "token-xyz",
      });
      const result = await client.get("/me");
      expect(result).toEqual({ ok: true, value: "token-xyz" });
    });
  });

  // AMBIGUOUS: the contract only states that requireToken is exported from @/lib/http; its
  // behaviour (return value on success, what happens when no token is present) is not
  // described anywhere in the numbered contract. Testing only the one behaviour that any
  // reasonable reading of its name would require.
  describe("requireToken", () => {
    // TRIAGED — SPEC GAP, AMENDED — see custody/evidence/0001/06-amendments. `requireToken` is now specified as returning a Result. This test predates that and asserts a bare token; it cannot pass as written, and regenerating it is a barriered run's job rather than an edit.
    it.skip("returns the token carried on a request that has one", () => {
      const request = {
        method: "GET",
        path: "/me",
        params: {},
        body: undefined,
        token: "tok-1",
      };
      expect(requireToken(request as any)).toBe("tok-1");
    });
  });
});
