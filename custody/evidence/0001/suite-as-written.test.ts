// Test suite written against the specification for `~/lib/kernel/failure`
// alone. The implementation was never read. Every assertion cites the
// contract clause (F1..F19) or specification section it is drawn from.
//
// Where the spec is silent or ambiguous, the test is either omitted or
// marked "[inference]" at the point it is made — see the accompanying
// report for the full list.

import { describe, it, expect } from "vitest";
import * as F from "~/lib/kernel/failure";

// ---------------------------------------------------------------------------
// One constructor per kind, in exactly the order FAILURE_KINDS declares them
// (§F1a pins that order/membership, so this ordering is given, not assumed).
// ---------------------------------------------------------------------------

type CtorEntry = { kind: F.FailureKind; make: (message: string) => F.Failure };

const CONSTRUCTORS: CtorEntry[] = [
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

// =============================================================================
// The sets — F1, F1a, F2, F3
// =============================================================================

describe("the closed set of kinds (F1, F1a)", () => {
  it("TRANSPORT_KINDS and DOMAIN_KINDS share no member", () => {
    const domainAsStrings = F.DOMAIN_KINDS as readonly string[];
    const overlap = F.TRANSPORT_KINDS.filter((k) => domainAsStrings.includes(k));
    expect(
      overlap,
      "a kind cannot describe both a transport-layer condition and a domain answer at once — that is the split the whole module is built on",
    ).toEqual([]);
  });

  it("FAILURE_KINDS is exactly the union of TRANSPORT_KINDS and DOMAIN_KINDS, with no duplicates", () => {
    const union = [...F.TRANSPORT_KINDS, ...F.DOMAIN_KINDS];
    expect(
      new Set(F.FAILURE_KINDS).size,
      "a duplicate kind would make membership tests and exhaustive switches ambiguous",
    ).toBe(F.FAILURE_KINDS.length);
    expect([...F.FAILURE_KINDS].slice().sort()).toEqual(union.slice().sort());
  });

  it("TRANSPORT_KINDS is exactly the seven named in §3, by name", () => {
    expect([...F.TRANSPORT_KINDS]).toEqual([
      "unauthenticated",
      "forbidden",
      "rate_limited",
      "unavailable",
      "timeout",
      "canceled",
      "internal",
    ]);
  });

  it("DOMAIN_KINDS is exactly the three named in §3, by name", () => {
    expect([...F.DOMAIN_KINDS]).toEqual(["not_found", "invalid", "conflict"]);
  });
});

describe("every kind is classified by exactly one guard — totality (F2)", () => {
  it.each(F.FAILURE_KINDS)("%s is transport xor domain, never both and never neither", (k) => {
    const transport = F.isTransportKind(k);
    const domain = F.isDomainKind(k);
    expect(
      transport !== domain,
      `"${k}" must be classified by exactly one of isTransportKind/isDomainKind`,
    ).toBe(true);
  });

  // Inference beyond the letter of F2, which only constrains members of
  // FAILURE_KINDS: a value outside the closed set should not be misfiled as
  // transport or domain either. Reasonable given "closed at runtime" in F3,
  // but not stated verbatim for these two guards specifically. [inference]
  it("a value outside FAILURE_KINDS is classified as neither transport nor domain [inference]", () => {
    expect(F.isTransportKind("seat_limit_reached")).toBe(false);
    expect(F.isDomainKind("seat_limit_reached")).toBe(false);
  });
});

describe("isFailureKind is closed at runtime (F3)", () => {
  it.each(F.FAILURE_KINDS)("recognises %s as a known kind", (k) => {
    expect(F.isFailureKind(k)).toBe(true);
  });

  const notKinds: [string, unknown][] = [
    ["an unrecognised product-specific string", "seat_limit_reached"],
    ["an empty string", ""],
    ["a number", 42],
    ["null", null],
    ["undefined", undefined],
    ["a boolean", true],
    ["a plain object", { kind: "internal" }],
    ["an array", ["internal"]],
  ];
  it.each(notKinds)("rejects %s as not a known kind", (_label, value) => {
    expect(
      F.isFailureKind(value),
      "a value outside FAILURE_KINDS must never be accepted — that is what 'closed at runtime' means",
    ).toBe(false);
  });
});

// =============================================================================
// Constructors — F4..F8
// =============================================================================

describe("each constructor produces exactly its own kind (F4)", () => {
  it("constructing every kind and reading back .kind reproduces FAILURE_KINDS exactly", () => {
    const kinds = CONSTRUCTORS.map((c) => c.make("msg").kind);
    expect(
      kinds,
      "a constructor that produces the wrong kind, or FAILURE_KINDS that omits one, would surface here",
    ).toEqual([...F.FAILURE_KINDS]);
  });
});

describe("message is passed through unchanged, never paraphrased (F5)", () => {
  const messages = ["simple", "", 'quotes "like this" and\nnewlines', "unicode ☺ 日本語"];
  for (const { kind, make } of CONSTRUCTORS) {
    for (const msg of messages) {
      it(`${kind} preserves message ${JSON.stringify(msg)} byte for byte`, () => {
        expect(
          make(msg).message,
          "message is diagnostic and goes in a log — a constructor that alters it corrupts the log line",
        ).toBe(msg);
      });
    }
  }
});

describe("invalid always carries fields; no other variant does (F6)", () => {
  it("invalid() with no fields argument still carries an empty fields object, not an absent one", () => {
    const f = F.invalid("bad input");
    expect(
      Object.prototype.hasOwnProperty.call(f, "fields"),
      "fields must be present even when empty — invalid always carries it, per F6",
    ).toBe(true);
    expect(f.fields).toEqual({});
  });

  it("invalid() with fields carries them unchanged", () => {
    const f = F.invalid("bad input", { email: "not an email" });
    expect(f.fields).toEqual({ email: "not an email" });
  });

  it.each(CONSTRUCTORS.filter((c) => c.kind !== "invalid"))(
    "$kind never carries a fields property",
    ({ make }) => {
      const f = make("msg") as unknown as Record<string, unknown>;
      expect(
        Object.prototype.hasOwnProperty.call(f, "fields"),
        "fields belongs to invalid alone — any other kind carrying it defeats the type system's job of catching this",
      ).toBe(false);
    },
  );
});

describe("only rate_limited may carry retryAfter (F7)", () => {
  it("rate_limited() without retryAfter has no retryAfter property", () => {
    const f = F.rateLimited("slow down");
    expect(Object.prototype.hasOwnProperty.call(f, "retryAfter")).toBe(false);
  });

  it("rate_limited() with retryAfter carries it unchanged", () => {
    const f = F.rateLimited("slow down", 30);
    expect(f.retryAfter).toBe(30);
  });

  it("rate_limited() with retryAfter of zero preserves zero, not absence", () => {
    // 0 is a falsy JS value; a constructor written as `if (retryAfter)` would
    // silently drop a legitimate "retry immediately" instruction from the wire.
    const f = F.rateLimited("slow down", 0);
    expect(
      Object.prototype.hasOwnProperty.call(f, "retryAfter"),
      "retryAfter=0 is a valid wire value and must not be treated the same as omitted",
    ).toBe(true);
    expect(f.retryAfter).toBe(0);
  });

  it.each(CONSTRUCTORS.filter((c) => c.kind !== "rate_limited"))(
    "$kind never carries a retryAfter property",
    ({ make }) => {
      const f = make("msg") as unknown as Record<string, unknown>;
      expect(
        Object.prototype.hasOwnProperty.call(f, "retryAfter"),
        "retryAfter belongs to rate_limited alone",
      ).toBe(false);
    },
  );
});

describe("a constructor never invents metadata (F8)", () => {
  const optionalKeys = ["type", "requestId", "status", "cause"] as const;

  it.each(CONSTRUCTORS)("$kind omits every optional meta key when not supplied", ({ make }) => {
    const f = make("msg") as unknown as Record<string, unknown>;
    for (const key of optionalKeys) {
      expect(
        Object.prototype.hasOwnProperty.call(f, key),
        `${key} was never supplied — it must be absent, not present-and-undefined, or a failure that crossed JSON would not equal one that did not`,
      ).toBe(false);
    }
  });

  it("a supplied meta field is present and unchanged", () => {
    const cause = F.internal("underlying");
    const f = F.forbidden("nope", { type: "org_scope", requestId: "req-1", status: 403, cause });
    expect(f.type).toBe("org_scope");
    expect(f.requestId).toBe("req-1");
    expect(f.status).toBe(403);
    expect(f.cause).toEqual(cause);
  });

  it("invalid's fields and meta are independent of one another", () => {
    const f = F.invalid("bad", { email: "required" }, { requestId: "req-9" });
    expect(f.fields).toEqual({ email: "required" });
    expect(f.requestId).toBe("req-9");
  });

  it("rate_limited's retryAfter and meta are independent of one another", () => {
    const f = F.rateLimited("slow down", 5, { requestId: "req-9" });
    expect(f.retryAfter).toBe(5);
    expect(f.requestId).toBe("req-9");
  });

  it("an absent optional key survives a JSON round trip as absent, not as null or undefined", () => {
    const f = F.internal("boom");
    const roundTripped = JSON.parse(JSON.stringify(f)) as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(roundTripped, "type"),
      "this only holds if the constructor never wrote the key as `undefined` in the first place",
    ).toBe(false);
  });
});

// =============================================================================
// Recognition — F9, F10, F11
// =============================================================================

describe("isFailure is structural — round trip through JSON (F9)", () => {
  it.each(CONSTRUCTORS)("a bare $kind survives JSON.stringify/parse and is still recognised", ({ make }) => {
    const f = make("msg");
    const roundTripped = JSON.parse(JSON.stringify(f));
    expect(
      F.isFailure(roundTripped),
      "isFailure must be structural — this is the entire reason a failure is a plain object and not a class",
    ).toBe(true);
  });

  it("a rate_limited carrying retryAfter survives the round trip", () => {
    const f = F.rateLimited("slow down", 15);
    expect(F.isFailure(JSON.parse(JSON.stringify(f)))).toBe(true);
  });

  it("an invalid carrying fields survives the round trip", () => {
    const f = F.invalid("bad", { name: "required" });
    expect(F.isFailure(JSON.parse(JSON.stringify(f)))).toBe(true);
  });

  it("a failure with a nested cause survives the round trip, cause included", () => {
    const inner = F.timeout("upstream timed out");
    const outer = F.because(F.unavailable("service down"), inner);
    const roundTripped = JSON.parse(JSON.stringify(outer));
    expect(F.isFailure(roundTripped)).toBe(true);
    expect(
      F.isFailure(roundTripped.cause),
      "a cause is itself a Failure and must remain structurally recognisable after the same JSON crossing",
    ).toBe(true);
  });

  it("every bare construction is recognised as a failure before any round trip occurs", () => {
    for (const { make } of CONSTRUCTORS) {
      expect(F.isFailure(make("msg"))).toBe(true);
    }
  });
});

describe("isFailure rejects everything structurally unlike a failure (F10)", () => {
  const notFailures: [string, unknown][] = [
    ["null", null],
    ["undefined", undefined],
    ["a bare string", "internal"],
    ["a number", 42],
    ["an array", ["internal", "message"]],
    ["an object with no kind", { message: "oops" }],
    ["an object whose kind is not a known kind", { kind: "seat_limit_reached", message: "oops" }],
    ["an object with a known kind but a non-string message", { kind: "internal", message: 42 }],
  ];
  it.each(notFailures)("rejects %s", (_label, value) => {
    expect(
      F.isFailure(value),
      "isFailure rejecting anything structurally unlike a Failure is the whole contract",
    ).toBe(false);
  });
});

describe("isTransport agrees with isTransportKind for every constructible failure (F11)", () => {
  it.each(CONSTRUCTORS)("$kind: isTransport(f) equals isTransportKind(f.kind)", ({ kind, make }) => {
    const f = make("msg");
    expect(F.isTransport(f)).toBe(F.isTransportKind(kind));
  });

  it.each(CONSTRUCTORS)("$kind: isDomain(f) equals isDomainKind(f.kind)", ({ kind, make }) => {
    const f = make("msg");
    expect(F.isDomain(f)).toBe(F.isDomainKind(kind));
  });

  it.each(F.TRANSPORT_KINDS)("%s is transport, never domain", (k) => {
    const entry = CONSTRUCTORS.find((c) => c.kind === k)!;
    const f = entry.make("msg");
    expect(F.isTransport(f)).toBe(true);
    expect(F.isDomain(f)).toBe(false);
  });

  it.each(F.DOMAIN_KINDS)("%s is domain, never transport", (k) => {
    const entry = CONSTRUCTORS.find((c) => c.kind === k)!;
    const f = entry.make("msg");
    expect(F.isDomain(f)).toBe(true);
    expect(F.isTransport(f)).toBe(false);
  });
});

// =============================================================================
// Cause chain — F12, F13, F14, F15
// =============================================================================

describe("because attaches a cause without disturbing anything else, and without mutation (F12)", () => {
  it("the returned failure differs from the original only in cause", () => {
    const original = F.forbidden("nope", { requestId: "req-1" });
    const cause = F.internal("underlying");
    const withCause = F.because(original, cause);

    const originalPlain = JSON.parse(JSON.stringify(original)) as Record<string, unknown>;
    const withCausePlain = JSON.parse(JSON.stringify(withCause)) as Record<string, unknown>;
    delete withCausePlain.cause;

    expect(withCause.cause).toEqual(cause);
    expect(
      withCausePlain,
      "because must not disturb any field besides cause",
    ).toEqual(originalPlain);
  });

  it("does not mutate the original failure object", () => {
    const original = F.timeout("slow");
    const before = JSON.stringify(original);
    F.because(original, F.internal("x"));
    expect(
      JSON.stringify(original),
      "because must return a new value — the original the caller already holds a reference to must be unchanged after the call",
    ).toBe(before);
  });

  it("the original has no cause property before the call, and none after", () => {
    const original = F.timeout("slow");
    expect(Object.prototype.hasOwnProperty.call(original, "cause")).toBe(false);
    F.because(original, F.internal("x"));
    expect(
      Object.prototype.hasOwnProperty.call(original, "cause"),
      "because must not add a cause to the object the caller already holds a reference to",
    ).toBe(false);
  });
});

describe("chain walks causes outermost-first, beginning with the failure itself (F13)", () => {
  it("a failure with no cause has a chain of exactly itself", () => {
    const f = F.internal("boom");
    const c = F.chain(f);
    expect(c).toEqual([f]);
    expect(c[0], "chain must begin with the failure itself").toBe(f);
  });

  it("a three-deep cause chain is walked outermost first, not innermost first", () => {
    const root = F.internal("root cause");
    const middle = F.because(F.timeout("mid"), root);
    const outer = F.because(F.unavailable("outer"), middle);

    const c = F.chain(outer);
    expect(
      c.map((x) => x.kind),
      "the caller's own failure must come first — a caller reading chain()[0] for the proximate cause must not get the deepest one instead",
    ).toEqual(["unavailable", "timeout", "internal"]);
    expect(c[0]).toBe(outer);
  });
});

describe("chain terminates on a cycle (F14)", () => {
  it(
    "a failure that is its own cause does not hang or overflow",
    () => {
      const f = F.internal("self-referential") as unknown as Record<string, unknown>;
      f.cause = f;
      const c = F.chain(f as unknown as F.Failure);
      expect(
        Array.isArray(c),
        "chain must return a value, not hang or blow the stack, when a failure causes itself",
      ).toBe(true);
    },
    2000,
  );

  it(
    "two failures that cause each other do not hang or overflow",
    () => {
      const a = F.internal("a") as unknown as Record<string, unknown>;
      const b = F.internal("b") as unknown as Record<string, unknown>;
      a.cause = b;
      b.cause = a;
      const c = F.chain(a as unknown as F.Failure);
      expect(
        Array.isArray(c),
        "chain must return a value, not hang, on a mutual cause cycle",
      ).toBe(true);
    },
    2000,
  );
});

describe("rootCause is the last element of chain (F15)", () => {
  it("rootCause of a failure with no cause is the failure itself", () => {
    const f = F.notFound("gone");
    expect(F.rootCause(f), "with no cause, the failure is its own root").toBe(f);
  });

  it("rootCause of a deep chain agrees with chain's last element", () => {
    const root = F.internal("root cause");
    const middle = F.because(F.timeout("mid"), root);
    const outer = F.because(F.unavailable("outer"), middle);

    const c = F.chain(outer);
    expect(F.rootCause(outer)).toEqual(c[c.length - 1]);
    expect(F.rootCause(outer).kind).toBe("internal");
  });
});

// =============================================================================
// Retry classification — F16, F17, F18
// =============================================================================

describe("retry classification (F16, F17, F18)", () => {
  const RETRYABLE: F.FailureKind[] = ["rate_limited", "unavailable", "timeout"];

  it("exactly rate_limited, unavailable and timeout are retryable — nothing more, nothing less", () => {
    const actuallyRetryable = CONSTRUCTORS.filter((c) => F.isRetryable(c.make("msg"))).map((c) => c.kind);
    expect(
      actuallyRetryable.slice().sort(),
      "a kind added to or missing from this set silently changes what a caller will retry",
    ).toEqual(RETRYABLE.slice().sort());
  });

  it.each(RETRYABLE)("%s is retryable", (k) => {
    const entry = CONSTRUCTORS.find((c) => c.kind === k)!;
    expect(F.isRetryable(entry.make("msg"))).toBe(true);
  });

  it("canceled is not retryable — the caller asked to stop; retrying redoes the thing they cancelled (F17)", () => {
    expect(F.isRetryable(F.canceled("stopped by caller"))).toBe(false);
  });

  it.each(F.DOMAIN_KINDS)(
    "%s, a domain kind, is never retryable — a 4xx is an answer, not a glitch (F18)",
    (k) => {
      const entry = CONSTRUCTORS.find((c) => c.kind === k)!;
      expect(F.isRetryable(entry.make("msg"))).toBe(false);
    },
  );

  it("unauthenticated, forbidden and internal are not retryable", () => {
    for (const k of ["unauthenticated", "forbidden", "internal"] as const) {
      const entry = CONSTRUCTORS.find((c) => c.kind === k)!;
      expect(F.isRetryable(entry.make("msg")), `${k} must not be retryable`).toBe(false);
    }
  });
});

// =============================================================================
// Exhaustiveness — F19
// =============================================================================

describe("assertNever throws when reached (F19)", () => {
  it("throws for a value passed in from a supposedly-exhausted switch", () => {
    expect(() => F.assertNever("unreachable" as never)).toThrow();
  });

  it("throws for an arbitrary untyped value — the backstop must not silently pass through", () => {
    expect(() => F.assertNever({ kind: "surprise" } as never)).toThrow();
  });
});
