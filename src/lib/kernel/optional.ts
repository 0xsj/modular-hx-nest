import { because, internal, type Failure, type Fails } from "./failure";
import { Err, Ok, type Result } from "./result";

/* Three states, and the fix for v2's `optional`.
 *
 * v2 absorbed EVERY `not_found` into "looked and found nothing". Verified
 * against the memory adapter: a route nobody registered came back as "empty",
 * and the screen said "no primary target has been chosen" about a fixture that
 * had never been asked. A fixture easier to satisfy than the server — the
 * exact lie the adapter exists to prevent.
 *
 * The root of it: whether a 404 means ABSENT or means WRONG PATH is a property
 * of the backend, not of the kernel. So the caller says which. `absent` is
 * required, and a `not_found` it does not recognise is NOT passed through with
 * a type that promised it could not occur — it folds to `internal` with the
 * original as cause. A screen must not claim emptiness it cannot distinguish.
 *
 *     Result<T,        E>                              nobody looked · here it is
 *     Result<T | null, Exclude<E, not_found> | internal>  + looked and found nothing */
export async function optional<T, E extends Failure>(
  r: Promise<Result<T, E>> | Result<T, E>,
  absent: (f: Fails<"not_found">) => boolean,
): Promise<
  Result<T | null, Exclude<E, Fails<"not_found">> | Fails<"internal">>
> {
  const settled = await r;
  if (settled.ok) return new Ok(settled.value);
  const f: Failure = settled.error;
  if (f.kind !== "not_found")
    return new Err(f as Exclude<E, Fails<"not_found">>);
  if (absent(f)) return new Ok(null);
  return new Err(
    because(
      internal(f.message, {
        type: f.type,
        requestId: f.requestId,
        correlationId: f.correlationId,
        status: f.status,
      }),
      f,
    ),
  );
}

/** The weak choice, named so it can be grepped. Use it only for a backend that
 *  cannot distinguish "nothing here" from "no such path" — and know that any
 *  404, including a typo in the endpoint, will then render as absence. */
export const anyNotFound = (_f?: Fails<"not_found">): boolean => true;

/** Absence identified by the server's `type`. The usual choice. */
export const absentWhenType =
  (type: string) =>
  (f: Fails<"not_found">): boolean =>
    f.type === type;

/** The render-side counterpart, so a component names all three rather than
 *  falling into `value ? … : "–"` and losing one. */
export type Presence<T, E extends Failure = Failure> =
  | { state: "found"; value: T }
  | { state: "empty" }
  | { state: "unmeasured"; failure: E };

export function presenceOf<T, E extends Failure>(
  r: Result<T | null, E>,
): Presence<T, E> {
  if (!r.ok) return { state: "unmeasured", failure: r.error };
  return r.value === null
    ? { state: "empty" }
    : { state: "found", value: r.value };
}
