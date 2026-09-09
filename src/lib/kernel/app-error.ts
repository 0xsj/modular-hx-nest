import { internal, isFailure, type Failure } from "./failure";
import type { Result } from "./result";

/* The one place a failure becomes a throw. Specification:
 * `app-error.doc.ts`; clause numbers below cite it. */

/** X1–X4. The only class this tree throws.
 *
 *  It extends `Error` rather than wrapping one because an error boundary, a
 *  logger and a debugger all expect an `Error` — a plain object thrown instead
 *  arrives with no stack, and where it came from is the one thing anybody
 *  wants at that point. */
export class AppError extends Error {
  readonly failure: Failure;

  constructor(failure: Failure) {
    /* X2 — a log line that prints only the error still says something. */
    super(failure.message);
    this.name = "AppError";
    this.failure = failure;
  }
}

/** X5/X6. The sanctioned conversion, and the only one.
 *
 *  Nothing below the framework edge throws; the edge is where that stops being
 *  possible, because a rendering framework signals failure by a rejected
 *  promise and neither an error boundary nor an async resource reads a
 *  `Result`. */
export function unwrap<T>(result: Result<T, Failure>): T {
  if (result.ok) return result.value;
  throw new AppError(result.error);
}

/** X7–X14. TOTAL: every input becomes a failure and this never throws. An
 *  error path that can itself fail replaces one diagnosis with a worse one.
 *
 *  A ladder of narrowing guesses, ordered most to least certain. THE ORDER IS
 *  OBSERVABLE — an `AppError` is also an `Error`, so testing for `Error` first
 *  would flatten every thrown failure to `internal` and lose the kind, which
 *  is the one thing the model exists to carry. */
export function asFailure(cause: unknown): Failure {
  /* X8 — the local case. */
  if (cause instanceof AppError) return cause.failure;

  /* X9 — a failure that crossed a boundary as DATA. It has no prototype of
     ours, so the check has to be structural; that is the whole reason a
     failure is plain data. */
  if (isFailure(cause)) return cause;

  /* X10 — an AppError that crossed and lost its prototype. The class is gone;
     the field survives. */
  const carried = (cause as { failure?: unknown } | null | undefined)?.failure;
  if (isFailure(carried)) return carried;

  /* X11/X14 — an ordinary Error. Its name rides in `type`, and an empty
     message still yields a named failure: a nameless one is worse than a
     generic one. */
  if (cause instanceof Error) {
    return internal(cause.message || "Something went wrong.", { type: cause.name });
  }

  /* X12 */
  return internal("Something went wrong.");
}
