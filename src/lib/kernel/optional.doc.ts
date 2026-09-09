/**
 * `optional` and `Presence` — the mechanism for the three states.
 *
 * An oracle under `flover-solid ADR 0001`; written before `optional.ts`
 * existed. §4 is normative and numbered. Decided by `flover-solid ADR 0004`.
 *
 *
 * # 1 · The rule this exists to make obeyable
 *
 * `CLAUDE.md`: *nobody looked* and *looked and found nothing* are different
 * facts, and a UI rendering both as an em-dash has thrown away the difference
 * at the moment it had it.
 *
 * That rule has been stated since the project began and nothing implemented
 * it. A rule with no mechanism is a rule the first caller re-invents — and the
 * re-invention here is one line, `value ? render(value) : "–"`, which loses
 * the distinction silently and looks like ordinary defensive code.
 *
 *
 * # 2 · Whether a 404 means ABSENT is a fact about the backend
 *
 * This is the whole design and everything else follows from it.
 *
 *     the resource is not there      absence. A real answer
 *     there is no such path          a defect — a typo, an unbuilt route,
 *                                    a fixture nobody wrote
 *
 * Both arrive as `not_found`. Which one a given 404 is depends on how the
 * backend behaves, and the kernel cannot know that. So the kernel does not
 * decide: **the caller passes a predicate saying which `not_found` means
 * absent**, and it is required rather than defaulted.
 *
 * A default would have to pick one, and the only usable default — *treat every
 * 404 as absence* — is the dangerous reading. Under it a typo in an endpoint
 * path renders as *looked and found nothing*, which is a screen confidently
 * reporting a measurement nobody took.
 *
 * ## An unrecognised `not_found` is not emptiness, and not passed through
 *
 * If the predicate says no, the failure is neither absence nor something the
 * caller's type promised. It folds to `internal`, carrying the original as
 * `cause` — the same fold `narrow` performs for an unpromised domain kind, and
 * for the same reason: the signature stays true and nothing is lost.
 *
 * Passing it through would be worse than either. The returned type says
 * `not_found` can no longer occur, so a caller's exhaustive switch has no
 * branch for it.
 *
 *
 * # 3 · Two types, because the question is asked twice
 *
 *     optional     at the SERVICE boundary — turns a failure into a value
 *     Presence     at the RENDER boundary — names all three so a component
 *                  cannot write a two-armed conditional and lose one
 *
 *     Result<T, E>
 *        -> Result<T | null, Exclude<E, not_found> | internal>
 *        -> Presence<T, E>  =  found · empty · unmeasured
 *
 * `null` is the absence marker. `undefined` is not, and a service returning it
 * is returning a value it has not thought about.
 *
 *
 * # 4 · CONTRACT
 *
 * ## optional
 *
 *   O1  Accepts a `Result` or a `Promise` of one, and always returns a
 *       `Promise`. A caller need not know which it has.
 *
 *   O2  An `Ok` passes through carrying the same value, by identity.
 *
 *   O3  A failure whose kind is NOT `not_found` passes through unchanged — by
 *       identity, not a copy. `optional` decides one kind and touches nothing
 *       else.
 *
 *   O4  A `not_found` for which the predicate returns true becomes `Ok(null)`.
 *
 *   O5  A `not_found` for which the predicate returns false becomes `Err` of
 *       `internal`, carrying the original as `cause`.
 *
 *   O6  That fold PRESERVES `message`, `type`, `requestId`, `correlationId`
 *       and `status` from the original. It is the same fold as the narrowing
 *       one, and a divergence between the two is a defect in whichever moved.
 *
 *   O7  The predicate is called with the `not_found` failure itself, and is
 *       called ONLY for `not_found` — never for an `Ok`, never for any other
 *       kind.
 *
 * ## The two supplied predicates
 *
 *   O8  `anyNotFound` returns true for every `not_found`. It is the weak
 *       choice and exists to be greppable: adopting it says *this backend
 *       cannot distinguish nothing-here from no-such-path*, and accepts that a
 *       mistyped endpoint will render as absence.
 *
 *   O9  `absentWhenType(t)` returns true exactly when the failure's `type` is
 *       `t`, and false when `type` is absent.
 *
 * ## Presence
 *
 *   O10 `presenceOf` maps an `Err` to `unmeasured` carrying the failure, an
 *       `Ok(null)` to `empty`, and any other `Ok` to `found` carrying the
 *       value.
 *
 *   O11 `empty` and `unmeasured` are never the same state. This is the clause
 *       the whole module exists for: a component that cannot tell them apart
 *       has thrown the distinction away at the moment it had it.
 *
 *   O12 The three states are exhaustive and mutually exclusive — every
 *       `Result<T | null, E>` maps to exactly one.
 *
 *   O13 `Ok(undefined)` is `found`, not `empty`. `null` is the absence marker
 *       and `undefined` is a value nobody thought about.
 *
 *
 * # 5 · Mechanics
 *
 * **The returned error type both removes and adds.** `not_found` is excluded
 * because it can no longer occur; `internal` is added because O5 can produce
 * one. A signature that only removed would be lying in the other direction.
 *
 * **The predicate is a function, not a list of types.** A backend that marks
 * absence by a status, a header, or the shape of a message is served by the
 * same seam, and a list would have to grow a case for each.
 *
 *
 * # 6 · Deliberately absent
 *
 * **A default predicate.** See §2. The friction is the feature: a caller that
 * has not decided which 404 means absence has not finished designing the read.
 *
 * **A `Presence` for a collection.** An empty list is not the same question —
 * a read that returned zero rows LOOKED. Whether a component wants a fourth
 * state for *not applicable* is a real question and no caller has asked it.
 *
 * **Rendering.** `Presence` is a type, not a component. What an `unmeasured`
 * looks like is a design decision and belongs where the design is.
 *
 *
 * # 7 · What this specification does NOT decide
 *
 *   - What any predicate should be for a particular backend.
 *   - Whether a service should call `optional` itself or leave it to a screen.
 *   - The `message` of the folded `internal` beyond O6's preservation.
 *   - What `Presence` looks like rendered.
 */
export {};
