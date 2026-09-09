/**
 * The one place a failure becomes a throw.
 *
 * An oracle under `flover-solid ADR 0001`; written before `app-error.ts`
 * existed. §3 is normative and numbered. Decided by `flover-solid ADR 0003`.
 *
 *
 * # 1 · Why anything throws at all
 *
 * Nothing below the framework edge throws. A failure is a value, the transport
 * returns a `Result`, and control flow stays visible in the types — that is
 * the whole of `ADR 0003`.
 *
 * The edge is where that stops being possible. A rendering framework signals
 * failure by a REJECTED PROMISE: that is what an error boundary catches and
 * what an async resource propagates. Neither reads a `Result`. So somewhere a
 * value has to become a rejection, and the only question is whether that
 * happens in one place or in every screen.
 *
 * This module is the one place. `unwrap` is the sanctioned conversion and
 * there is no other.
 *
 *
 * # 2 · The return journey is the harder half
 *
 * Throwing is easy. Catching is where the design is, because **what arrives in
 * a catch is `unknown`** and it may have travelled.
 *
 * An `AppError` that crossed a serialisation boundary is no longer an
 * `AppError` — the prototype is gone and `instanceof` answers false — but the
 * `failure` field survives, because a failure is plain data. That is the
 * asymmetry the whole model was built for, arriving at the one place that has
 * to cope with it.
 *
 * So `asFailure` is a ladder of narrowing guesses, ordered from most to least
 * certain, and it is TOTAL: every input becomes a failure, and it never
 * throws. An error path that can itself fail replaces one diagnosis with a
 * worse one.
 *
 *     an AppError                     -> the failure it carries
 *     something structurally a Failure -> itself. This is a failure that
 *                                        crossed a boundary as DATA
 *     something with a .failure field  -> that. This is an AppError that
 *                                        crossed and lost its prototype
 *     an Error                         -> internal, keeping its message and
 *                                        its name as `type`
 *     anything at all                  -> internal, with a constant message
 *
 * **The order is observable and it is part of the contract.** An `AppError`
 * IS an `Error`; if the `Error` rung came first, every thrown failure would be
 * flattened to `internal` and its kind lost — the exact information the model
 * exists to carry.
 *
 *
 * # 3 · CONTRACT
 *
 * ## AppError
 *
 *   X1  `AppError` is an `Error`: `instanceof Error` is true, and it has a
 *       stack.
 *
 *   X2  Its `message` is the failure's `message`, so a log line that prints
 *       only the error still says something.
 *
 *   X3  Its `name` is `"AppError"`.
 *
 *   X4  It carries the failure as `.failure`, BY IDENTITY — not a copy.
 *
 * ## unwrap
 *
 *   X5  `unwrap(ok)` returns the value by identity, and does not throw.
 *
 *   X6  `unwrap(err)` throws an `AppError` whose `.failure` is that error by
 *       identity.
 *
 * ## asFailure
 *
 *   X7  TOTAL. It returns a `Failure` for every input and never throws — for
 *       `null`, `undefined`, a string, a number, a symbol, an array, a plain
 *       object, and a circular object.
 *
 *   X8  Given an `AppError`, it returns the carried failure by identity.
 *
 *   X9  Given something structurally a `Failure`, it returns that value by
 *       identity. This is how a failure that crossed a boundary as data is
 *       recovered.
 *
 *   X10 Given an object whose `failure` field is structurally a `Failure`, it
 *       returns that field. This is how an `AppError` that crossed a boundary
 *       and lost its prototype is recovered.
 *
 *   X11 Given an `Error` that is none of the above, it returns `internal` with
 *       the error's `message`, and the error's `name` as `type`.
 *
 *   X12 Given anything else, it returns `internal` with a fixed message.
 *
 *   X13 THE ORDER OF THE RUNGS IS OBSERVABLE. An `AppError` must be recognised
 *       as an `AppError` and not as an `Error` — the first would preserve its
 *       kind and the second would flatten it to `internal`.
 *
 *   X14 An `Error` whose `message` is empty still produces a failure with a
 *       non-empty `message`. A nameless failure is worse than a generic one.
 *
 *
 * # 4 · Mechanics
 *
 * **`AppError` extends `Error` rather than wrapping one.** A framework's error
 * boundary, a logger and a debugger all expect an `Error` — a plain object
 * thrown instead arrives with no stack, and the one thing anybody wants at
 * that point is where it came from.
 *
 * **`asFailure` uses `instanceof` for `AppError` and a STRUCTURAL check for a
 * `Failure`.** Deliberately mixed. `instanceof` is correct for the local case
 * and useless for the travelled one, and the structural rung exists precisely
 * because `instanceof` cannot answer it.
 *
 *
 * # 5 · Deliberately absent
 *
 * **Any framework import.** This module is the edge's SHAPE, not its wiring.
 * What catches the rejection is the framework's business and lives in a tier
 * that may import one.
 *
 * **A `try`-wrapping helper.** A function that runs a callback and converts a
 * throw is one line at the call site and a policy everywhere else.
 *
 * **Logging.** `asFailure` classifies. Where a failure is reported is a
 * product's decision.
 *
 *
 * # 6 · What this specification does NOT decide
 *
 *   - Where `unwrap` is called. Only that it is the sole conversion.
 *   - The exact text of X12's fixed message.
 *   - Whether `AppError` should carry a `cause` in the platform sense.
 *   - What an error boundary renders.
 */
export {};
