import type { FailureKind } from "../kernel";

/** What to do to one matching request. Every field is independent; several may
 *  apply at once, and they are applied in the order documented on `Effect`. */
export type Effect = {
  /** Return this failure kind instead of calling through. */
  fail?: FailureKind;
  /** Return a SUCCESS that is empty. `"null"` for a single value that may
   *  legitimately be absent, `"list"` for a collection.
   *
   *  The axis that matters most and the one nobody asks for: in development a
   *  fixture always has data, so the empty branch of every screen ships
   *  unlooked-at. */
  empty?: "null" | "list";
  /** Milliseconds to wait before doing anything else. Reveals loading states. */
  latency?: number;
  /** Never settle.
   *
   *  NOT the same as the transport's own time budget elapsing — chaos wraps the
   *  client rather than living inside it, so nothing here can trip that timer.
   *  This produces a promise that never resolves, which is the *stuck spinner*
   *  case: a screen with no timeout of its own hangs forever. For the failure a
   *  real timeout produces, use `fail: "timeout"`.
   *
   *  Honoured cancellation: an aborted signal still resolves, as `canceled`. */
  hang?: boolean;
  /** 0..1. How often this effect applies. Deterministic given the plan's seed,
   *  so a probabilistic run replays identically. Absent means always. */
  p?: number;
};

/** Keys are `"METHOD /path"`, where `*` matches a path segment run, or the bare
 *  `"*"` for every request. First match in insertion order wins, so put the
 *  specific rules first. */
export type Plan = {
  rules: ReadonlyArray<readonly [pattern: string, effect: Effect]>;
  /** Makes a probabilistic plan replayable. A bug you cannot reproduce is an
   *  anecdote. */
  seed?: number;
};

/** `"GET /targets/*"` → a matcher. `*` covers one or more path segments. */
export function matches(
  pattern: string,
  method: string,
  path: string,
): boolean {
  if (pattern === "*") return true;
  const [pMethod, ...rest] = pattern.split(" ");
  const pPath = rest.join(" ");
  if (pMethod.toUpperCase() !== method.toUpperCase()) return false;
  if (!pPath) return true;
  const rx = new RegExp(
    "^" +
      pPath
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^?]*") +
      "$",
  );
  return rx.test(path);
}

export function effectFor(
  plan: Plan,
  method: string,
  path: string,
): Effect | undefined {
  for (const [pattern, effect] of plan.rules) {
    if (matches(pattern, method, path)) return effect;
  }
  return undefined;
}

/** mulberry32 — small, and the only property that matters is that the same seed
 *  gives the same sequence. Not for anything but reproducing a chaos run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const isActive = (plan: Plan | undefined): boolean =>
  Boolean(plan?.rules.length);
