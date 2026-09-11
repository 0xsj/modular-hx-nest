import type { Failure } from "./failure";

/* Result is a class, Failure is plain data — v2's asymmetry, kept:
 *
 *   Failure  crosses the server/client boundary constantly → must be data
 *   Result   never crosses it — it is unwrapped at the tier that produced it
 *
 * One change from v2: `ok()` returns `Ok<T, E>` and `err()` returns `Err<T, E>`,
 * not the widened union. v2 threw that precision away — `ok(1).value` did not
 * typecheck — while claiming the opposite virtue for its constructors.
 *
 * THE RULE THAT COMES WITH A CLASS: a Result must not be returned from a
 * Server Action or passed as a prop to a client component. `toJSON` makes an
 * accidental serialisation degrade to `{ ok, value }` rather than `{}`, and
 * `fromJSON` rehydrates — but the boundary shape should be explicit form state,
 * as in the server action bindings. */

export class Ok<T, E = Failure> {
  readonly ok = true as const;
  constructor(readonly value: T) {}

  map<U>(f: (value: T) => U): Result<U, E> {
    return new Ok(f(this.value));
  }
  mapErr<F>(_f: (error: E) => F): Result<T, F> {
    // An Ok contains no E; changing its error type preserves the same value.
    return this as unknown as Result<T, F>;
  }
  andThen<U, F = E>(f: (value: T) => Result<U, F>): Result<U, E | F> {
    return f(this.value);
  }
  match<U>(on: { ok: (value: T) => U; err: (error: E) => U }): U {
    return on.ok(this.value);
  }
  unwrapOr<U>(_fallback: U): T | U {
    return this.value;
  }
  /** A side effect on the failure path only — a log, a metric. Returns `this`,
   *  so it cannot change what the caller sees. */
  tapErr(_f: (error: E) => void): Result<T, E> {
    return this;
  }
  toJSON() {
    return { ok: true as const, value: this.value };
  }
}

export class Err<T, E = Failure> {
  readonly ok = false as const;
  constructor(readonly error: E) {}

  map<U>(_f: (value: T) => U): Result<U, E> {
    // An Err contains no T; the unused success branch preserves identity.
    return this as unknown as Result<U, E>;
  }
  mapErr<F>(f: (error: E) => F): Result<T, F> {
    return new Err(f(this.error));
  }
  andThen<U, F = E>(_f: (value: T) => Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }
  match<U>(on: { ok: (value: T) => U; err: (error: E) => U }): U {
    return on.err(this.error);
  }
  unwrapOr<U>(fallback: U): T | U {
    return fallback;
  }
  tapErr(f: (error: E) => void): Result<T, E> {
    f(this.error);
    return this;
  }
  toJSON() {
    return { ok: false as const, error: this.error };
  }
}

export type Result<T, E = Failure> = Ok<T, E> | Err<T, E>;

export const ok = <T, E = Failure>(value: T): Ok<T, E> => new Ok(value);
export const err = <T = never, E = Failure>(error: E): Err<T, E> =>
  new Err(error);

/** Every value, or the FIRST failure. Tuple-preserving. First rather than all,
 *  deliberately: a screen rendering one problem surface has no use for the
 *  rest, and a caller that wants them all is asking a different question. */
export function all<T extends readonly Result<unknown, unknown>[]>(
  results: [...T],
): Result<
  { [K in keyof T]: T[K] extends Result<infer V, unknown> ? V : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  const values: unknown[] = [];
  for (const r of results) {
    if (!r.ok) return new Err(r.error as never);
    values.push(r.value);
  }
  return new Ok(values as never);
}

/** Sequential composition where step one is async. Provided; the early return
 *  is usually clearer past two steps. TypeScript has no `?`, and no combinator
 *  invented here changes that. */
export async function andThenAsync<T, U, E, F = E>(
  r: Result<T, E>,
  f: (value: T) => Promise<Result<U, F>>,
): Promise<Result<U, E | F>> {
  return r.ok ? f(r.value) : new Err(r.error);
}

/** Rehydrate a Result that crossed a boundary it should not have. */
export function fromJSON<T, E>(
  v: { ok: true; value: T } | { ok: false; error: E },
): Result<T, E> {
  return v.ok ? new Ok(v.value) : new Err(v.error);
}
