# Local furniture is a loan against a component that does not exist yet

A page that needs a control the design system has not built yet builds its own,
and that copy is a debt nothing tracks: the day the real component lands there
is no error, no failing test, and no reminder — just two implementations that
start agreeing and stop.

**Origin** — a catalogue page with its own theme switch and its own hand-rolled
wordmark, written because the group that owns them was still empty. Building
that group made both redundant, and finding them was a grep rather than a
build failure.

## Why the debt is invisible

Every other kind of duplication announces itself eventually. This one does not,
because the local copy is CORRECT — it was written to work, it does work, and
it goes on working after the shared version exists. Nothing about the page
changes when the component lands.

What changes is that the two can now drift. The shared one gains a keyboard
contract, an accessible name, a state store; the local one keeps whatever it
had on the day it was written. And because the page still looks right, the
drift is only discovered by someone comparing them on purpose.

The worst version is the one where the local copy is the older, worse
implementation and the page in question is the CATALOGUE — the page whose job
is to show what the system does.

## Repayment happens in stages, and stopping halfway is normal

The real sequence here, over three sittings:

```
  1  the page owns the markup AND the state       nothing else exists
  2  the state moves to a runtime tier            the page owns only the control
  3  the control moves to its component group     the page owns nothing
```

Stage 2 is where it usually stops, because it fixes the visible problem — the
state was the part that was actually wrong. The leftover control looks fine and
survives.

The tell that a stage remains: the file has a comment explaining why it is
local. That comment is the loan agreement, and it is worth writing precisely
because it is what makes the debt findable later.

## What makes it repayable at all

**Write the reason in the file, not in a tracker.** "This is here because X
does not exist" travels with the code and is greppable; a ticket is neither.

**Name the thing it is standing in for.** A comment that says "temporary" is
not actionable; one that says "until `chrome/theme-toggle` exists" is a search
that finds itself when the group is built.

**Delete the local styles in the same commit.** The class outlives the
component — a dead `.wordmark` rule is the residue that makes the next reader
think there is still a wordmark to style.

**Check the page after, not just the tests.** Nothing fails when the swap is
incomplete. What catches it is looking at the rendered output and counting: one
wordmark, one theme control, one source of the state.

## The distinction worth keeping

Not every local component is a loan. A catalogue's own *furniture* — the frame
around a demo, the navigation built from a registry — is genuinely local and
should never be promoted, because promoting it would make the design system
depend on the page that displays it.

The test is whether the thing is **part of the product** or **part of the
apparatus for looking at it**. A theme control is the product's. A case frame
is not, and naming it something the design system will never use is what keeps
the two from being confused.

## Used in

`src/routes/kitchen-sink.tsx` now composes `chrome/mark` and the two toggles;
its former `_components/theme-switch.*` are deleted. The frame around each
demo (`Section`, `Case`, `Row`) stays local, deliberately, and says so in its
own header.

## Related

- [[an-explicitness-rule-pays-only-at-the-boundary]]
- [[a-preference-that-defers-to-the-platform-needs-a-third-state]]
