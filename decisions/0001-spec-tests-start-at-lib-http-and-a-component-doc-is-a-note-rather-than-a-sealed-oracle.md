# 0001 — spec tests start at `lib/http`, and a component's doc is a note rather than a sealed oracle

**Status:** Accepted   ·   **Date:** 2026-09-08

## Context

`Button` landed on 2026-09-08 with a `doc.ts` that opened by declaring itself
the oracle, carried a numbered contract `B1`–`B16`, and was written and hashed
before `button.tsx` existed. Sixteen clauses were then checked by driving the
rendered page with a throwaway browser probe.

Three facts about that make the question unavoidable rather than academic.

**The probe was not committed and does not run again.** So the contract is
currently a document with no check behind it, and the next edit to `button.tsx`
can break any of the sixteen silently.

**There is no test runner.** That stack row is open, so nothing has yet been
written under any method, and whatever is decided here is decided before the
first suite rather than after — which is the only time the choice is free.

**`src/lib` is almost empty.** `kernel/cn`, `http/port.ts` and six `doc.ts`
files. The tier the procedure is aimed at has not been built, and the tier it is
not aimed at has one component in it. Deciding after that inverts is how a
method gets adopted by whichever module happened to be written first.

The forcing question: does every component now owe a barriered, mutation-scored
suite? [`protocols/spec-tests.md`](../protocols/spec-tests.md) is expensive by
design — an oracle-sanitising pass, an agent whose tool grant makes reading the
source impossible, a triage pass, and a mutation round — and it says plainly
that step 6 is what makes the other six worth anything.

## Decision

**Spec tests apply to `src/lib/**` and begin with `lib/http`.** A spec test here
means the whole procedure: an oracle that is not the implementation, a writer
behind an enforced barrier, triage of every failure as a finding first, and a
mutation ratio as the reported result. Anything short of that is not a spec test
and must not be recorded as one.

**Components are not spec-tested.** Where a component is tested at all it gets
ordinary unit and interaction tests, written with the implementation in view,
asserting accessible output rather than class names.

**A component's `doc.ts` is a module note** in the sense of
[`protocols/notes.md`](../protocols/notes.md) — why this looks like this. It is
not sealed, not hashed as an oracle, and never passed to a barriered writer. It
may still be written before the implementation, because that is good design
pressure, but the pressure is the whole of the benefit and it is collected at
the moment of writing.

**`lib/http` first**, ahead of `services`, `root` and `kernel`, for three
reasons that are properties of that module rather than preferences:

- **Its oracle is not ours.** The wire shape is a fact about a server. A
  document describing it cannot have been derived from our decoder, which is
  the strongest oracle rank the procedure lists.
- **It is the module where a bug can already exist.** Whether `kind` is a
  top-level key or nested, whether a request id survives when the body is not
  ours, what a malformed error body decodes to — each is a decision that is
  either right or wrong about a real endpoint, and a test derived from the
  implementation would pin whichever we guessed.
- **It has a property worth stating and no way to check it by review.**
  [`protocols/fixtures.md`](../protocols/fixtures.md) requires the memory
  adapter to be indistinguishable from the fetch adapter from above. *For every
  refusal, both adapters produce the same error value* is a universally
  quantified claim over two implementations — the first category in
  [`spec-tests.role.md`](../protocols/spec-tests.role.md), and exactly what a
  barriered writer is good at.

## Alternatives

**Spec-test components as well.** Declined because the scoring step degenerates.
The mutation round is what separates a real suite from a vacuous one, and the
cheap mutants in a presentational component are class-map swaps — replace
`s.primary` with `s.secondary` and the only test that kills it is one asserting
a class name. [`protocols/accessibility.md`](../protocols/accessibility.md) says
not to write that test: *"A test that asserts a class name passes on a component
that announces nothing."* So the mutants that are easy to kill are the ones we
are told not to chase, and the mutants worth killing — a lost `aria-describedby`,
a focus that never returns — are a small set better reached by axe and one
interaction test per overlay. Paying for a barrier to arrive there is paying for
independence from an implementation the test was never going to be derived from.

**No spec tests anywhere; ordinary unit tests throughout.** Declined because a
test derived from the implementation is a snapshot: it passes on day one,
inherits every existing bug as an expectation, and can only catch a future
regression. For a decoder written against a server nobody has read carefully,
that is the failure mode rather than an edge case.

**Spec-test components but skip the mutation round.** Declined on the
procedure's own terms. A first-run pass is equally consistent with a perfect
suite and a suite that asserts nothing, and only mutation separates them. A
barriered suite with no ratio is the expensive half of the method with the
scoring half removed.

**Start at `lib/services` instead.** Declined on sequencing rather than
principle. `services` is empty, its shape is fixed by a rule rather than
discovered, and its contract is *takes a client, returns a promise* — which the
type system already holds. `http` is the module underneath it and the one whose
answers `services` will be built on top of; getting it wrong first means
re-deriving the tests above it.

**Seal component docs anyway, for the provenance rather than the tests.**
Declined because a seal that guards nothing trains people to ignore seals. A
sealed document that no barriered writer ever reads is bookkeeping, and
[`protocols/custody.md`](../protocols/custody.md) says so about its own store:
*"A custody directory nobody reads is bookkeeping."*

## Consequences

**`Button`'s sixteen clauses now have no check, and nothing in this record fixes
that.** The probe that verified them was deliberately not committed. Until an
interaction test exists, `B1`–`B16` can regress silently, and the most likely
one to go is `B11` — no manufactured handler — because the change that breaks it
looks defensive in review. This is the direct cost of the decision and it is
unmitigated today.

**The component defect class this project cares most about is now caught by
review.** `accessibility.md` opens by saying these defects are the ones most
likely to be invisible to the person who introduced them: the form renders,
looks right, passes a screenshot review, and is unusable with a screen reader.
Choosing not to put a barrier there means that class is held by lint, by axe,
and by a person — and naming it here is what keeps it from being mistaken for a
guarantee.

**`doc.ts` now means two things depending on which tier it is in.** A reader has
to know which. The mitigation is narrow and checkable: only a doc under
`src/lib/**` may describe itself as an oracle, and a component doc must not.

**Immediate, and required by this record:**
`src/components/forms/button/doc.ts` opens with *"THIS DOCUMENT IS THE ORACLE."*
That sentence is false under this decision and must be replaced. The
written-before-the-implementation note stays, because it is still true and it is
still the reason the contract is worth anything.

**The boundary is behaviour, not directory.** A component that acquires logic
that can be wrong about the world — a filter predicate, a comparator, a date
parser, a selection rule — is a candidate to move. The trigger for revisiting
this record is that logic appearing, not a component count.

## Verification

**Not verified.** There is no test runner, no enforcement runner and no custody
store, so nothing today can tell you this record is being followed.

What would verify it, when those exist:

- an enforcement rule asserting that no custody entry names a path under
  `src/components` — the barrier was never applied to a component;
- an enforcement rule asserting that no `doc.ts` outside `src/lib/**` DECLARES
  itself an oracle. The first draft of this line said *"the string `ORACLE`
  appears in no `doc.ts` outside `src/lib/**`"*, and grepping for it hit
  `components/forms/button/doc.ts` — the file that correctly says it is *not*
  one. A rule that fires on its own disclaimer is the shape
  `protocols/enforcement.md` warns about: *a check that is mostly wrong trains
  people to ignore it, which is worse than not having the check.* The rule has
  to match the declaration form, not the noun, and exempt the negation;
- a rule that every module under `src/lib` with a `doc.ts` and a caller has a
  recorded mutation ratio.

Until then this is a convention held by review, and that is a known weakness
rather than an oversight. `protocols/enforcement.md`: *a discipline that is not
a failing check is a preference.*

## Correction, before sealing

The `ORACLE` grep above was corrected in the sitting this record was accepted,
after the bad version of the rule was actually run and fired against a correct
file. `protocols/decisions.md` allows exactly this and no more: a record becomes
immutable when it is **sealed**, not when it is marked Accepted, and the gap
between the two is the only window in which a mistake may be corrected. Nothing
in Context, Decision, Alternatives or Consequences moved.

**This record is not sealed.** No sealing tool exists in this repository yet, so
the guarantee is currently *nobody has edited this*, held by git alone. That is
weaker than tamper-evident and it is stated rather than implied.

Cite this record as `flover-solid ADR 0001`.
