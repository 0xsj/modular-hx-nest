# A primitive may not manufacture a handler

A prop the caller never passed, appearing in the rendered output, is a
capability requirement the caller never agreed to — and the change that
introduces it always looks like the defensive one.

**Origin** — paid for in a framework with a server/client boundary, then
re-derived where that boundary does not exist. The original: a Button
synthesised an `onClick` to swallow the event while inert. It compiled,
and then every page rendering a Button failed to prerender with
*"Event handlers cannot be passed to Client Component props."* A function prop
cannot cross that boundary, so a component that always attaches a handler is
silently client-only and takes every server-rendered page that uses it along.

The second half is the durable one: **the rule survives into a framework where
that specific failure does not exist**, and the reasons it survives are better
than the one that produced it.

## The rule

Handlers are passed through, never created. If a component was not given a
function, it does not attach one.

Express the state declaratively instead, and let the platform enforce it:

```
  the real disabled attribute   unfocusable, unclickable, announced
  a negative tab index          out of the tab order where the attribute
                                does not apply
  pointer-events, from a data   off, read by the stylesheet
  attribute the component sets
```

Three declarations, no function.

## Why it holds without the boundary that produced it

**A declarative state is readable and a swallowing handler is not.** Anyone can
look at a rendered element and see that it is disabled. Nobody can see that a
click is being eaten by a closure — so the next person removes the attribute,
believing the handler covers it, and the control becomes live again with the
same appearance.

**A manufactured handler collides with prop merging.** Where polymorphism hands
props to a caller, the caller's handler is *composed* with the component's
rather than replacing it. A component that synthesises one gives every caller a
second listener firing on every interaction, which they cannot see and did not
ask for.

**A conditional handler is still a handler**, and it is worse. `inert ? swallow
: props.onClick` reintroduces the whole problem for exactly the callers who
reach the true branch, and does it non-deterministically — so the failure shows
up in one state and not the other and reads as a state bug.

**The direction of the mistake is the one that hides.** Adding a handler to make
a component *safer* — swallow the click while inert, guard a double submit —
reads as care in review. That is why the rule has to be stated rather than left
to judgement.

## The general form

The framework detail is the least durable part. A component that manufactures
behaviour it was not asked for takes on a requirement its callers never agreed
to: here a runtime boundary, elsewhere a context that must exist, a store that
must be provided, a lifecycle that must run. **The tell is the same everywhere —
a prop the caller never passed appears in the output.**

## Gotchas

**The obvious test for this is vacuous, and mutation is what says so.** The
natural assertion is *no `on*` attribute appears on the element*. In a framework
that delegates events through a property rather than an attribute, that
assertion is true whether or not a handler was manufactured — it passes against
correct code and against the mutant equally.

Measured: mutating a component to add a swallowing handler was killed **only by
a separate test** asserting that a caller's own handler still runs. The
attribute test never moved. Rewritten to read the delegated property, the same
mutant was killed by both.

```
  attribute assertion    mutant SURVIVED this test    vacuous
  delegated property     mutant killed                real
```

**A test like that needs its own control.** An assertion that a set is empty is
only meaningful if something can put an entry in it, so the suite also asserts
that the same check *does* see a handler that was passed. Without that, the day
the framework changes how it attaches events, the check silently stops measuring
anything and keeps passing.

**The declarative version is sometimes incomplete, and the honest move is to say
so rather than reach for the handler.** A link styled as an inert control can be
taken out of the tab order and made unclickable, and still be activated by Enter
if something focuses it programmatically. Closing that needs exactly the
manufactured handler this rule forbids. The right answer is a rule about call
sites — *do not render a link you do not want followed* — recorded where
somebody reaching for that combination will meet it.

## Used in

`src/components/forms/button/button.tsx`; clauses B11 and B12 of its `doc.ts`,
and the three tests plus one control in `button.test.tsx` that pin them.

## Related

- [[ark-aschild-hands-the-props-over-and-drops-the-ref]] — why a caller's handler is composed rather than replaced
- [[a-check-that-cannot-fail-is-not-a-check]]
