# An open overlay can look absent to a test in four different ways

Every one of them reports the same thing — "unable to find an element with the
role dialog" — about a dialog that is open, correct, and on the screen. Three
are the harness, one is the interaction, and none of them is a bug in the
component under test.

**True of `@ark-ui/solid` 5.39.1 / `@zag-js/*` 1.43.3 with
`@solidjs/testing-library` 0.8.10 and happy-dom · verified 2026-09-09 —
measured.**

**Origin** — writing the first interaction tests for the overlay group. Twelve
of seventeen failed, all with the same message, for four unrelated reasons.

## 1 · The content is portalled, and the queries are not

Every overlay renders through a portal, so its content lands in
`document.body`. `render`'s returned queries are scoped to the container it
created — a `div` the portal is not inside — so they cannot see it.

```
  render(...).getByRole("dialog")   -> not found
  screen.getByRole("dialog")        -> found
```

The tell is in the error itself: it lists the accessible roles it DID find, and
the trigger is there with `aria-expanded="true"`. An expanded trigger and no
dialog means the dialog is outside the scope, not missing.

## 2 · Opening takes two turns, and the second one is the visible one

```
  sync        hidden=true    data-state=closed
  microtask   hidden=true    data-state=open
  macrotask   hidden=false   data-state=open
```

The state flips on a microtask; the `hidden` attribute clears on a macrotask.
And `getByRole` correctly excludes a hidden element — it is not in the
accessibility tree — so a check that waits one turn sees an element the library
has already opened and the user cannot yet see either.

Awaiting a macrotask covers both. `findBy*` also works, because it polls.

## 3 · `waitFor(() => {})` waits for nothing

The empty callback does not throw, so the first attempt succeeds and the helper
resolves immediately. It reads as "let things settle" and is a no-op.

Anything used as a settle point has to either assert a real condition or await
an actual turn of the loop. This one is worth calling out separately because it
*looks* like the fix for §2 and is not — it is the reason §2 stayed hidden.

## 4 · The library ignores interactions a real user would not perform

Not a timing problem. Two measured cases where the machine deliberately
declines an event that arrives without its context:

**A menu item ignores a bare click.** It must be HIGHLIGHTED first — which a
pointer does by moving over it and a keyboard does by arrowing to it. Firing
only `click` selects nothing.

```
  click                          -> onSelect not called
  pointerMove, then click        -> called
  ArrowDown, then Enter          -> called
```

**A tooltip ignores a plain `focus`.** It opens on *keyboard* focus, and the
library tracks input modality to decide — which is correct behaviour, and the
reason clicking a button does not pop a tip over the thing you just pressed.
Establishing modality with a `keydown` for Tab before focusing is what a real
Tab does.

Both are the library being right. A test that fires the minimal event asserts
something no user does.

## Gotchas

**All four produce the same error message.** The failure text names the role
that was not found, and gives no hint whether the cause was scope, timing, an
empty wait, or an event the machine refused. Work through them in order — scope
first, because it is the one the error already tells you about.

**"Nothing opened" and "opened somewhere I cannot see" look identical.** Check
the trigger's `aria-expanded` before assuming the component is broken; it is
the cheapest way to split the two.

**A one-second timeout on a `findBy*` hides §4 as a timeout.** An interaction
the machine declined never resolves, and the failure arrives a second later
looking like slowness rather than refusal.

## Used in

`src/components/overlays/overlays.test.tsx` — the `settled()` helper awaiting a
macrotask, `screen`-scoped queries throughout, and the menu and tooltip cases
that perform the full interaction rather than the minimal event.

## Related

- [[a-zag-callback-settles-on-a-microtask]]
- [[a-check-that-cannot-fail-is-not-a-check]]
- [[a-solid-component-under-vitest-renders-to-nothing-by-default]]
