import { describe, expect, test } from "vitest";
import {
  isRetryable,
  retryDelay,
  RETRY_BASE_MS,
  RETRY_CAP_MS,
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
} from "./index";

// F6 — exactly three kinds are retryable, and a refusal is never one.
// F7 — the retry delay honours the server before it honours the client.
//
// Scope: retryability and the retry delay only.

const RETRYABLE = [
  ["rate_limited", rateLimited("slow down")] as const,
  ["unavailable", unavailable("down")] as const,
  ["timeout", timeout("timed out")] as const,
];

const NOT_RETRYABLE = [
  ["unauthenticated", unauthenticated("no token")] as const,
  ["forbidden", forbidden("no access")] as const,
  ["not_found", notFound("missing")] as const,
  ["invalid", invalid("bad input")] as const,
  ["conflict", conflict("clash")] as const,
  ["canceled", canceled("the caller asked to stop")] as const,
  ["internal", internal("server broke")] as const,
];

// The three retryable kinds that do not carry a server-issued retryAfter:
// their delay must come from the client's own growth curve, not a server hint.
const GROWS_WITHOUT_SERVER_HINT = [
  ["rate_limited (no retryAfter)", rateLimited("slow down")] as const,
  ["unavailable", unavailable("down")] as const,
  ["timeout", timeout("timed out")] as const,
];

describe("F6 — exactly three kinds are retryable", () => {
  test.each(RETRYABLE)(
    "%s is retryable — one of exactly three kinds the spec names",
    (_name, failure) => {
      expect(isRetryable(failure)).toBe(true);
    },
  );

  test.each(NOT_RETRYABLE)(
    "%s is not retryable — asking again asks the same question and hopes for a different reply",
    (_name, failure) => {
      expect(isRetryable(failure)).toBe(false);
    },
  );

  test("canceled is not retryable, even though it resembles an interruption", () => {
    // canceled is an ANSWER: the caller asked to stop, and retrying would
    // undo the thing the caller just did.
    const f = canceled("the caller asked to stop");
    expect(isRetryable(f)).toBe(false);
  });

  test.each([...RETRYABLE, ...NOT_RETRYABLE])(
    "%s: isRetryable agrees with whether retryDelay actually produces a value",
    (_name, failure) => {
      // Conservation: retryability and "there is a delay to report" are the
      // same fact seen from two functions. They must not disagree.
      expect(isRetryable(failure)).toBe(retryDelay(failure, 0) !== null);
    },
  );
});

describe("F7 — a non-retryable failure has no delay, not a zero one", () => {
  test.each(NOT_RETRYABLE)(
    "%s: retryDelay is null, not zero — the absence of a delay is distinguishable from a delay of zero",
    (_name, failure) => {
      const delay = retryDelay(failure, 0);
      expect(delay).toBeNull();
      expect(delay).not.toBe(0);
    },
  );

  test.each(NOT_RETRYABLE)(
    "%s: retryDelay stays null even for a negative attempt",
    (_name, failure) => {
      expect(retryDelay(failure, -1)).toBeNull();
    },
  );
});

describe("F7 — rate_limited with a server retryAfter is honoured over the client schedule", () => {
  test.each([1, 5, 30, 3600])(
    "retryAfter of %d second(s) becomes the delay, converted to milliseconds",
    (seconds) => {
      const f = rateLimited("slow down", seconds);
      expect(retryDelay(f, 0)).toBe(seconds * 1000);
    },
  );

  test("the retryAfter-derived delay does not change as the attempt grows", () => {
    // The server has stated when it will answer; a client backing off on its
    // own schedule on top of that is either early-and-refused or late for no
    // reason. The delay must be the same value at every attempt.
    const f = rateLimited("slow down", 7);
    const expected = 7 * 1000;
    for (const attempt of [0, 1, 5, 20]) {
      expect(retryDelay(f, attempt)).toBe(expected);
    }
  });

  test("a negative attempt does not change the retryAfter-derived delay either", () => {
    const f = rateLimited("slow down", 4);
    expect(retryDelay(f, -5)).toBe(4 * 1000);
  });
});

describe("F7 — the client-side backoff curve grows, but only up to a reachable cap", () => {
  test.each(GROWS_WITHOUT_SERVER_HINT)(
    "%s: the delay is positive at every attempt",
    (_name, failure) => {
      for (let attempt = 0; attempt <= 30; attempt++) {
        expect(retryDelay(failure, attempt)).toBeGreaterThan(0);
      }
    },
  );

  test.each(GROWS_WITHOUT_SERVER_HINT)(
    "%s: the delay never decreases as the attempt grows",
    (_name, failure) => {
      let previous = retryDelay(failure, 0) as number;
      for (let attempt = 1; attempt <= 30; attempt++) {
        const current = retryDelay(failure, attempt) as number;
        expect(current).toBeGreaterThanOrEqual(previous);
        previous = current;
      }
    },
  );

  test.each(GROWS_WITHOUT_SERVER_HINT)(
    "%s: the delay never exceeds RETRY_CAP_MS, so an outage cannot produce an unbounded wait",
    (_name, failure) => {
      for (let attempt = 0; attempt <= 50; attempt++) {
        expect(retryDelay(failure, attempt)).toBeLessThanOrEqual(RETRY_CAP_MS);
      }
    },
  );

  test.each(GROWS_WITHOUT_SERVER_HINT)(
    "%s: the cap is reached at an attempt below ten, and every larger attempt matches it exactly",
    (_name, failure) => {
      const attempts = Array.from({ length: 10 }, (_, i) => i);
      const capAttempt = attempts.find(
        (i) => retryDelay(failure, i) === RETRY_CAP_MS,
      );

      // If no attempt below ten reaches the cap, the curve underneath is
      // being tested instead of the cap itself — the failure this test is
      // designed to surface.
      expect(capAttempt).not.toBeUndefined();

      const beyond = (capAttempt as number) + 1;
      expect(retryDelay(failure, beyond)).toBe(RETRY_CAP_MS);
      // Probe an attempt far past where any uncapped curve would already
      // have overtaken the cap, to prove growth actually stopped.
      expect(retryDelay(failure, 50)).toBe(RETRY_CAP_MS);
      expect(retryDelay(failure, 100)).toBe(RETRY_CAP_MS);
    },
  );

  test.each(GROWS_WITHOUT_SERVER_HINT)(
    "%s: a negative attempt is treated as attempt zero, not refused",
    (_name, failure) => {
      expect(retryDelay(failure, -1)).toBe(retryDelay(failure, 0));
      expect(retryDelay(failure, -100)).toBe(retryDelay(failure, 0));
    },
  );
});

describe("F7 — the attempt counter is zero-based", () => {
  test("attempt 0 is the first retry and already yields a delay for a retryable failure", () => {
    const f = unavailable("down");
    const delay = retryDelay(f, 0);
    expect(delay).not.toBeNull();
    expect(delay as number).toBeGreaterThan(0);
  });
});

describe("the exported retry constants exist with the shape the API promises", () => {
  test("RETRY_BASE_MS and RETRY_CAP_MS are numbers", () => {
    // Values are deliberately not specified; only the exported symbols'
    // existence and type are part of the contract this suite can check.
    expect(typeof RETRY_BASE_MS).toBe("number");
    expect(typeof RETRY_CAP_MS).toBe("number");
  });
});
