import { foldToInternal, type Failure, type Fails } from "./failure";
import { Err, Ok, type Result } from "./result";

/* The mechanism for the three states. Specification: `optional.doc.ts`;
 * clause numbers below cite it. */

/** O1–O7. Turn "the resource is not there" into a value, and leave every other
 *  failure alone.
 *
 *  `absent` is REQUIRED and there is no default. Whether a 404 means absence
 *  or means wrong-path is a fact about the backend, and the kernel cannot know
 *  it. The only usable default would be *treat every 404 as absence*, which is
 *  the dangerous reading: under it a typo in an endpoint renders as *looked and
 *  found nothing* — a screen confidently reporting a measurement nobody took.
 *
 *      Result<T, E>
 *        -> Result<T | null, Exclude<E, not_found> | internal>
 *
 *  The error type both REMOVES and ADDS: `not_found` can no longer occur, and
 *  `internal` now can. */
export async function optional<T, E extends Failure>(
  result: Promise<Result<T, E>> | Result<T, E>,
  absent: (failure: Fails<"not_found">) => boolean,
): Promise<Result<T | null, Exclude<E, Fails<"not_found">> | Fails<"internal">>> {
  const settled = await result;
  if (settled.ok) return new Ok(settled.value);

  const failure: Failure = settled.error;
  /* O3 — one kind is decided here; everything else passes by identity. */
  if (failure.kind !== "not_found") {
    return new Err(failure as Exclude<E, Fails<"not_found">>);
  }
  /* O4 */
  if (absent(failure)) return new Ok(null);
  /* O5/O6 — not absence, and not something the returned type still admits.
     Folding keeps the signature true and loses nothing. */
  return new Err(foldToInternal(failure));
}

/** O8 — the weak choice, named so it can be grepped. Adopting it says *this
 *  backend cannot distinguish nothing-here from no-such-path*, and accepts
 *  that a mistyped endpoint will render as absence. */
export const anyNotFound = (_failure: Fails<"not_found">): boolean => true;

/** O9 — absence identified by the server's own marker. The usual choice. */
export const absentWhenType =
  (type: string) =>
  (failure: Fails<"not_found">): boolean =>
    failure.type === type;

/** O10–O13. The render-side counterpart, so a component names all three states
 *  rather than writing `value ? render(value) : "–"` and losing one.
 *
 *  `empty` and `unmeasured` are never the same state — that is the whole
 *  reason this type exists rather than `T | null`. */
export type Presence<T, E extends Failure = Failure> =
  | { state: "found"; value: T }
  | { state: "empty" }
  | { state: "unmeasured"; failure: E };

export function presenceOf<T, E extends Failure>(result: Result<T | null, E>): Presence<T, E> {
  if (!result.ok) return { state: "unmeasured", failure: result.error };
  /* O13 — `null` is the absence marker. `undefined` is a value nobody thought
     about, and it is `found`. */
  return result.value === null ? { state: "empty" } : { state: "found", value: result.value };
}
