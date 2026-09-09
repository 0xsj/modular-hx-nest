# 0004 — whether a 404 means absent is a fact about the backend, so the caller declares it and an unrecognised one is not emptiness

**Status:** Accepted   ·   **Date:** 2026-09-09

## Context

`CLAUDE.md` has said since the first commit that *nobody looked* and *looked
and found nothing* are different facts, and that a UI rendering both as an
em-dash has thrown the difference away at the moment it had it.

Nothing implemented it. The rule was stated, the kernel was built, the
transport was built, and the mechanism was never written — so the first caller
would have invented it, and the re-invention is one line,
`value ? render(value) : "–"`, which loses the distinction silently and reads
as ordinary defensive code.

**This record also corrects an inconsistency rather than only filling a gap.**
[[0003-a-failure-travels-as-a-value-and-the-split-ships-with-the-function-that-enforces-it]]
argued that a function making an already-specified rule executable is not a
modelled state with no caller, and shipped `narrow` on that basis. The
three-states rule is in the same position and was not treated the same way.
Nothing in the record explained the difference, because there was no reason —
one rule was noticed and the other was not.

The concrete hazard is already in this tree.
`src/lib/http/adapters.doc.ts` §4 establishes that an unserved fixture route
must not be `not_found`, precisely so a screen cannot report emptiness about an
endpoint nobody built. But a **legitimate** `not_found` still has to be
interpreted, and nothing was interpreting it.

## Decision

**`optional` turns one kind of failure into a value, and the caller says which
one.** It takes a `Result` (or a promise of one) and a predicate, and returns
`Result<T | null, Exclude<E, not_found> | internal>`. The error type both
removes and adds: `not_found` can no longer occur, and `internal` now can.

**The predicate is required. There is no default.** Whether a 404 means the
resource is absent or means the path is wrong is a property of a backend, and
the kernel cannot know it.

**An unrecognised `not_found` folds to `internal`**, carrying the original as
`cause` and preserving `message`, `type`, `requestId`, `correlationId` and
`status`. It is neither absence nor something the returned type still admits.

**That fold is now shared.** `narrow` and `optional` perform the same
operation, and it is extracted as `foldToInternal` rather than written twice.
The metadata list is the substance of the fold; having it in two places is
having it wrong in one.

**`Presence` names all three states at the render boundary** — `found`,
`empty`, `unmeasured` — so a component cannot write a two-armed conditional and
lose one. `null` is the absence marker; `undefined` is a value nobody thought
about, and it is `found`.

**Two predicates ship.** `absentWhenType(t)` is the usual choice.
`anyNotFound` is the weak one and is named so it can be grepped: adopting it
says *this backend cannot distinguish nothing-here from no-such-path*.

## Alternatives

**Default the predicate to "every 404 is absence".** Declined, and this is the
decision the record exists for. It is the only default that could be written,
and it is the dangerous reading: under it a typo in an endpoint path renders as
*looked and found nothing* — a screen confidently reporting a measurement
nobody took. A default that is wrong in the direction of overclaiming is worse
than friction.

**Pass an unrecognised `not_found` through unchanged.** Declined. The returned
type says `not_found` cannot occur, so a caller's exhaustive switch has no
branch for it. That is the same lie the transport/domain split exists to
prevent, one tier up.

**Return `T | null` and let components handle it.** Declined. `T | null` is
exactly two states, and the rule is about three. A component receiving it can
distinguish present from absent and cannot distinguish absent from never-asked
— which is the case that matters.

**Turn an unrecognised `not_found` into `empty` anyway, and warn.** Declined:
a warning is not a type, and the screen still renders emptiness.

**Do not build it; hold the rule by review.** Declined by ADR 0003's own
argument. Recorded because it was the de-facto position until now, and because
the reason it lost is narrow: it applies to a helper whose shape an existing
rule has already fixed, not to tiers in general.

## Consequences

**Every read that can be absent now takes a predicate.** That is friction, and
it is the point: a caller that has not decided which 404 means absence has not
finished designing the read. It will be felt as boilerplate before it is felt
as a guarantee.

**`anyNotFound` weakens the guarantee and ships anyway.** A backend that truly
cannot distinguish the two cases exists, and refusing to serve it would push
callers to write their own `() => true` without the name. Naming it means it
can be found; it does not make it safe.

**`Presence` is a third type components must learn**, alongside `Result` and
`Failure`. Three types for one read is a real cost and the alternative is
losing a distinction the product is built on.

**`failure.ts` changed to share the fold, so
`flover-solid ADR 0002`'s barriered run no longer covers it by hash.** The
refactor is behaviour-preserving — the unchanged barriered suite still passes,
109 of 109, and the mutation round still scores 19 of 19 — but the subject hash
recorded before that run now fails to match, and it should. That is the
mechanism reporting a change rather than a fault.

## Verification

**Partly verified, and the split is stated rather than blurred.**

*Verified:* the shared-fold refactor is behaviour-preserving. The barriered
kernel suite, unmodified, passes 109/109 against the refactored module, and the
19-mutant round still scores 19/19 with 0 invalid and controls at both ends.

*Not verified:* `optional` and `Presence` themselves. They have a
specification with thirteen clauses and no suite. A barriered run over
`optional.doc.ts` is owed, and until it exists this record should be read as a
decision that has been made rather than one that has been checked.

*Not verifiable here:* nothing detects a caller reaching for `anyNotFound` when
its backend could have distinguished the cases. That is a judgement about a
server, invisible from this side.

Cite this record as `flover-solid ADR 0004`.
