/**
 * `Result` — how a failure travels, as distinct from what a failure is.
 *
 * An oracle under `flover-solid ADR 0001`; written before `result.ts` existed.
 * §4 is normative and numbered. Decided by `flover-solid ADR 0003`.
 *
 *
 * # 1 · Why a class here and plain data next door
 *
 * `Failure` is a discriminated union of plain objects because it crosses a
 * serialisation boundary constantly and must survive losing its prototype.
 * `Result` is the opposite case and the asymmetry is deliberate:
 *
 *     Failure   crosses boundaries constantly    ->  must be data
 *     Result    never crosses one — it is
 *               unwrapped at the tier that
 *               produced it                       ->  may have methods
 *
 * A `Result` that is never serialised can afford to be a class, and being a
 * class is what lets a sequence of steps read in the order it runs:
 *
 *     r.map(parse).andThen(validate)      the order it happens
 *     andThen(map(r, parse), validate)    inside out
 *
 * That is the entire argument for the class over a plain `{ok, value} |
 * {ok, error}` union, and it is worth stating plainly because the union is
 * otherwise the better shape.
 *
 * **The rule that comes with the class:** a `Result` must not be returned
 * across a serialisation boundary. Nothing enforces that — see §6.
 *
 *
 * # 2 · What it is for
 *
 * A call that can fail routinely returns its failure in the type rather than
 * out of band. Three things follow:
 *
 *   · a service is a one-liner; there is no try/catch wrapper per call
 *   · the memory adapter reproduces a REFUSAL by returning one, which is what
 *     a fixture is actually for
 *   · control flow stays visible — a caller reads what can go wrong from the
 *     signature rather than from documentation
 *
 *
 * # 3 · Shape
 *
 *     Ok<T, E>    .ok = true    .value: T
 *     Err<T, E>   .ok = false   .error: E
 *     Result<T, E> = Ok<T, E> | Err<T, E>       E defaults to Failure
 *
 *     ok(value)   -> Ok<T, E>     NOT the widened union
 *     err(error)  -> Err<T, E>    NOT the widened union
 *
 * The constructors returning the exact variant rather than `Result` is load
 * bearing: `ok(1).value` must type-check without a narrowing step. A
 * constructor that widened would throw away the one thing it certainly knows.
 *
 *
 * # 4 · CONTRACT
 *
 * ## The discriminant
 *
 *   R1  `ok(v).ok` is `true` and `err(e).ok` is `false`, and both are readable
 *       without narrowing.
 *
 *   R2  `ok(v).value` is `v` by identity. `err(e).error` is `e` by identity.
 *       Neither is copied, cloned or re-wrapped.
 *
 * ## Combinators
 *
 *   R3  `map(f)` applies `f` to the value of an `Ok` and returns an `Ok` of the
 *       result. On an `Err` it does not call `f` at all and returns an `Err`
 *       carrying the same error.
 *
 *   R4  `mapErr(f)` is R3 mirrored: it applies on `Err`, does not call `f` on
 *       an `Ok`, and preserves the value.
 *
 *   R5  `andThen(f)` returns `f(value)` for an `Ok` — the result of `f`
 *       ITSELF, not an `Ok` wrapping it, so a chain does not nest. On an `Err`
 *       it does not call `f` and returns an `Err` with the same error.
 *
 *   R6  `match({ok, err})` calls exactly one branch and returns its value. The
 *       other branch is never invoked.
 *
 *   R7  `unwrapOr(fallback)` is the value for an `Ok` and `fallback` for an
 *       `Err`. It never throws.
 *
 * ## Immutability
 *
 *   R8  No combinator mutates the result it was called on. For every method,
 *       the original's `ok`, and its `value` or `error`, are unchanged
 *       afterwards.
 *
 * ## Crossing a boundary it should not have
 *
 *   R9  `toJSON()` produces `{ok: true, value}` for an `Ok` and
 *       `{ok: false, error}` for an `Err`. An accidental serialisation
 *       degrades to something legible rather than to `{}`.
 *
 *   R10 `fromJSON(r.toJSON())` reconstructs a `Result` that answers `ok`,
 *       `value` and `error` identically to `r`. Round-trip.
 *
 *
 * # 5 · Mechanics
 *
 * **Two classes, not one with a flag.** A single class carrying an optional
 * value and an optional error makes both fields optional on every instance,
 * so every read needs a check the discriminant already answered.
 *
 * **`E` defaults to `Failure`** so the common case writes `Result<User>`. The
 * parameter stays, because a tier that has narrowed its failures wants to say
 * so in the type.
 *
 *
 * # 6 · Deliberately absent
 *
 * **Enforcement of the no-serialisation rule.** `toJSON` makes an accident
 * legible; nothing prevents it. That is a stated hole in
 * `flover-solid ADR 0003` and it needs a check over a framework's boundary
 * markers, which do not exist here yet.
 *
 * **`all`, `tapErr`, `andThenAsync`.** Combinators with no caller. §1's
 * argument for the class rests on `map` / `andThen` / `match` reading in
 * order, and those ship; the rest are conveniences and a convenience with no
 * caller is a guess about how somebody will want to write something.
 *
 * **`unwrap` that throws.** Converting a failure into a rejected promise
 * happens once, at the framework edge — that is `ADR 0003`'s decision, and the
 * edge is not built.
 *
 *
 * # 7 · What this specification does NOT decide
 *
 *   - Whether `Result` is awaitable, or how a promise of one composes.
 *   - Whether two structurally identical results compare equal by any means
 *     other than structural equality.
 *   - What `E` should be for any particular tier beyond its default.
 *   - The behaviour of `fromJSON` on input that is not a `toJSON` output.
 */
export {};
