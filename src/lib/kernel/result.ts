import type { Failure } from "./failure";

/* How a failure travels. The specification is `result.doc.ts`, written before
 * this file existed; clause numbers below cite it.
 *
 * Two classes rather than one with a flag: a single class carrying an optional
 * value and an optional error makes both fields optional on every instance, so
 * every read needs a check the discriminant already answered. */

export class Ok<T, E = Failure> {
  readonly ok = true as const;
  constructor(readonly value: T) {}

  /** R3 — applies on Ok. */
  map<U>(f: (value: T) => U): Result<U, E> {
    return new Ok(f(this.value));
  }

  /** R4 — `f` is not called; the value is preserved. */
  mapErr<F>(_f: (error: E) => F): Result<T, F> {
    return new Ok(this.value);
  }

  /** R5 — returns `f`'s result ITSELF, so a chain does not nest. */
  andThen<U, F = E>(f: (value: T) => Result<U, F>): Result<U, E | F> {
    return f(this.value);
  }

  /** R6 — exactly one branch runs. */
  match<U>(on: { ok: (value: T) => U; err: (error: E) => U }): U {
    return on.ok(this.value);
  }

  /** R7 — never throws. */
  unwrapOr(_fallback: T): T {
    return this.value;
  }

  /** R9 — an accidental serialisation degrades to something legible rather
   *  than to `{}`. It does not make crossing a boundary correct. */
  toJSON() {
    return { ok: true as const, value: this.value };
  }
}

export class Err<T, E = Failure> {
  readonly ok = false as const;
  constructor(readonly error: E) {}

  map<U>(_f: (value: T) => U): Result<U, E> {
    return new Err(this.error);
  }

  mapErr<F>(f: (error: E) => F): Result<T, F> {
    return new Err(f(this.error));
  }

  andThen<U, F = E>(_f: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err(this.error);
  }

  match<U>(on: { ok: (value: T) => U; err: (error: E) => U }): U {
    return on.err(this.error);
  }

  unwrapOr(fallback: T): T {
    return fallback;
  }

  toJSON() {
    return { ok: false as const, error: this.error };
  }
}

export type Result<T, E = Failure> = Ok<T, E> | Err<T, E>;

/* The constructors return the EXACT variant, never the widened union — see
 * result.doc.ts §3. `ok(1).value` must type-check without a narrowing step; a
 * constructor that widened would throw away the one thing it certainly knows. */

export const ok = <T, E = Failure>(value: T): Ok<T, E> => new Ok(value);
export const err = <T = never, E = Failure>(error: E): Err<T, E> => new Err(error);

/** Every value, or the FIRST failure. Tuple-preserving.
 *
 *  First rather than all, deliberately: a screen renders one problem surface,
 *  and a caller that wants every failure is asking a different question and
 *  should ask it directly.
 *
 *  Shipped now because `services/example`'s independent composition is its
 *  first caller — `result.doc.ts` §6 deferred it as a convenience with none. */
export function all<T extends readonly Result<unknown, unknown>[]>(
  results: [...T],
): Result<
  { [K in keyof T]: T[K] extends Result<infer V, unknown> ? V : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  const values: unknown[] = [];
  for (const result of results) {
    if (!result.ok) return new Err(result.error as never);
    values.push(result.value);
  }
  return new Ok(values as never);
}

/** R10 — rebuild a Result that crossed a boundary it should not have. */
export function fromJSON<T, E>(
  value: { ok: true; value: T } | { ok: false; error: E },
): Result<T, E> {
  return value.ok ? new Ok(value.value) : new Err(value.error);
}
