# A check that cannot fail is not a check

A green run is evidence only if you have watched that same harness go red —
and there are three ways it silently cannot: the instrument never started, the
classifier reads its own failure as success, or the assertion is true of every
program.

**Origin** — three of them in one session, each measured rather than reasoned
about, and each green or perfect at the moment it was worthless.

## 1 · The instrument never started

The command fails at a layer *above* the thing under test, so nothing was
executed and nothing says so.

```
  timeout 240 <runner> | tail        command not found; exit status empty
  <runner> --reporter=<removed>      throws loading a reporter module, BEFORE
                                     any test executes
```

The first is a portability trap: `timeout` is GNU coreutils and is absent on
macOS, so wrapping a run in it kills every one of them with *command not
found*. The second is a major-version trap: a flag removed between majors that
fails during startup rather than being ignored.

Both produce output that looks like a run and contains no result.

## 2 · The classifier reads its own failure as success

The expensive one, because the error direction flatters you.

```
  cause                          exit   read as    truth
  a test genuinely failed         ≠0    failure    correct
  the subject did not compile     ≠0    failure    INVALID
  the runner binary is absent     ≠0    failure    nothing ran
```

For a **mutation** harness the polarity inverts and it gets worse: non-zero
means *the mutant was killed*, so every infrastructure failure scores as a
success and the ratio comes back perfect.

Measured: a harness reported INVALID on all six mutants **and both controls**,
which is what a broken run should look like. It only did that because it
required positive evidence — a parsed `Tests N passed` line — instead of
trusting the exit code. Reading the exit code alone would have reported *6 of 6
killed* from a process that executed nothing, and that number would have been
filed.

## 3 · The assertion is true of every program

The subtlest, because the harness ran correctly and the test is green for a
real reason — just not the reason anybody thought.

Measured: a test asserting that no `on*` attribute appears on a rendered
element, written to pin a rule that a component must not manufacture event
handlers. The framework delegates events through a property and never emits
such an attribute, so the set is empty whether or not a handler was
manufactured. It passed against correct code and against a deliberate mutant
identically, and had been green for thirty-five runs.

Nothing about the harness was wrong. The assertion was a tautology.

### The same shape, arrived at from the environment

The instance above was a tautology about the *platform*. The other source is an
environment that cannot answer the question at all, and it produces assertions
that are true of every program for a reason nothing in the test file shows.

Measured: a component resets `min-inline-size` on a `fieldset`, because the
browser default is `min-content` and a fieldset that will not shrink below its
widest child overflows a grid for no visible reason. The check:

```
  getComputedStyle(fieldset).minInlineSize
    rule present, via a CSS Module class      ""
    rule absent, a bare fieldset              ""
    same property set inline   <- control     "0px"
```

The property is perfectly readable; the simulated DOM simply applies no
cascade, so a CSS Module class never reaches computed style. It answers
identically for the code that has the rule and the code that lost it.

The control row is the part worth copying. Without it, `""` is equally
consistent with *the property is unsupported*, *the element is detached*, and
*the rule is genuinely missing* — and each of those implies a different fix.
Establishing that the instrument works before concluding anything about the
subject is the whole of this note applied to itself.

What matters is the *spelling*. `toBe("0px")` fails against both, which is a
loud, honest signal that the question cannot be asked here. The dangerous
spelling is the one that looks more careful: `not.toBe("min-content")` passes
against both, forever, and reads in review as a considered guard against
exactly the regression it cannot see.

**A negative assertion in an environment that returns nothing is the highest-risk
line in a suite**, because emptiness and correctness are the same observation.

### And from a stronger attribute standing in front of a weaker one

A third route to the same place, and the one most likely to survive review,
because the test reads as thorough.

Measured: a separator that is decorative by default sets both `role="none"`
and `aria-hidden="true"`. The test asserted the intent through a role query:

```
  queryByRole("separator")  ->  null        role="none"      correct
  queryByRole("separator")  ->  null        role="separator" MUTANT, still null
```

`aria-hidden` removes the element from the accessibility tree whatever its role
says, so the role assertion sits behind an attribute that dominates it and can
never fail. The test would have passed on a component that announces itself as
a separator and is hidden anyway — which is a real defect and precisely the one
it was written to catch.

**Where two attributes can produce the same observation, assert each one
separately.** Not because the tree query is wrong — it is the right assertion
for what a reader gets — but because it cannot distinguish "correct" from
"broken in a way something else is covering up".

The tell is that the mutation is in a DIFFERENT attribute from the one the
assertion queries. Any time a component writes two things that both bear on one
observable, only the dominant one is under test.

## How to tell

**A uniform result is the tell.** 12 of 12, 52 of 52, 100%. A real suite against
real code rarely produces one; a broken harness produces one reliably, because
nothing varies when nothing executes.

**But a uniform result is a reason to check the instrument, not proof against
it.** Also measured, the same day: a contrast audit reported 96 of 96 pairs
passing, which is exactly the shape above. It was genuine — the ratios spanned
4.93 to 17.4, and a negative control had run. **The distinction is variance
inside the result, not the headline.** A perfect score over values that all
differ is a finding; a perfect score over values that are all identical, or over
values nobody printed, is a question.

## The fix, in four forms

**A negative control.** One case whose outcome must be the opposite, checked
before anything else is trusted. It costs one run and catches the whole class.

**A control inside the suite, for any emptiness assertion.** An assertion that a
set is empty is meaningful only if something can put an entry in it — so pair it
with a case proving the same check *does* populate. Without that, the day the
platform changes how the thing is represented, the check stops measuring and
keeps passing.

**Zero inputs must fail, not pass.** An include pattern that matches no files, a
query that selects no rows, a glob that resolves to nothing — each is
indistinguishable from *no violations found* unless the harness treats an empty
subject as an error.

**A weaker check that names what it cannot see.** When the environment genuinely
cannot answer, the choice is not between a strong check and a weak one — it is
between one that is silently vacuous and one that is honestly narrower. Drop to
the strongest question the environment *can* answer, and say in the test why it
is not the question you wanted:

```
  wanted    the computed value is 0
  vacuous   the computed value is not the browser default    <- passes on ""
  taken     the declaration is present in the stylesheet     <- catches deletion
```

The source assertion cannot see a rule that is overridden, mis-scoped, or in the
wrong layer, and it must say so. What it does catch is the deletion, which is the
regression that actually happens. **A downgrade is only safe when it is
labelled**: an unlabelled weak check is indistinguishable from a strong one that
someone got wrong, and the next reader has no way to tell which they are looking
at.

## Gotchas

**The twin failure costs the same and looks opposite.** A check that fires
wrongly trains people to ignore it just as fast. A rule written to find
documents *claiming* to be an oracle, by matching the word, fired on the one
document that says it is **not** one. Precision is part of the rule, not a
detail of its implementation.

**Positive evidence, never absence of error.** *No error* is compatible with
*did not run*. Require something only a completed run can produce: a parsed
count, a named case, a value that varies between runs.

**Distrust the wrapper before the subject.** Every instance above was a layer
above the code under test — a timeout binary, a reporter flag, an attribute
lookup. When a result is surprising, the first hypothesis is the instrument.

**Shared mutable state makes a case pass for its POSITION in the file.**
Measured: a control reading a module-level store, and a test asserting it
defaults to "system". It passed — because it ran before the case that selects
"Dark", not because of anything the component does. Reorder the file and it
fails; run it alone and it passes again, which is the worst debugging shape
there is.

The check that this class of test is honest is a hook that resets the shared
state, plus one case at the END of the file asserting the reset happened.
Without that last case the hook itself is unverified, and deleting it breaks
nothing visible.

**The instrument is often a pattern.** Three separate audits in one session
reported clean because the pattern was wrong rather than the page: `<th[^>]*>`
matched every `<thead>`, and a dangling-reference sweep found nothing in a 404
document it had been handed by mistake. Both reported the shape of a pass. A
sweep over rendered output needs an assertion that the SUBJECT is present —
a case count, a known element — before any conclusion drawn from its absence
means anything.

**A check written alongside the thing it checks inherits its blind spot.** The
tautological assertion was written by the same session that wrote the component,
and both carried the same wrong assumption about how handlers reach the DOM.
Mutation is what surfaced it, because a mutant does not share the assumption —
which is the argument for scoring a suite rather than counting it.

## Used in

The mutation harness for `src/components/forms/button/button.test.tsx`, which
classifies a run with no parsed test count as INVALID rather than as a kill; the
paired control in that file proving the delegated-handler assertion can fail;
the contrast audit in `src/routes/kitchen-sink/_sections/tokens.tsx`, which
reports its skipped count and its ratio spread so a reader can tell a real pass
from a harness that did nothing; and the `min-inline-size` case in
`src/components/forms/controls.test.tsx`, which is a labelled downgrade to a
source assertion and states in the test what it can no longer see.

## Related

- [[a-primitive-may-not-manufacture-a-handler]] — the rule whose test was the tautology
- [[a-solid-component-under-vitest-renders-to-nothing-by-default]] — the removed flag, in its dependency context
- [[read-a-computed-style-after-the-transition-settles]] — the instrument being wrong in the other direction
- [[a-zag-callback-settles-on-a-microtask]] — a negative assertion that passes because nothing has happened yet
- [[a-render-prop-given-values-replaces-what-it-rendered]] — correct output as evidence of nothing
