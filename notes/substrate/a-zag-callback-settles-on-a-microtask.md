# A zag callback settles on a microtask, not during the event

`onCheckedChange` and friends do not run inside the click that caused them, so
a test that asserts immediately after `fireEvent` reads the state from before
the event — and the dangerous half of that is the assertion which passes.

**True of `@ark-ui/solid` 5.39.1 / `@zag-js/*` 1.43.3 · verified 2026-09-09 —
measured.**

**Origin** — a radio-group test asserting that the option's words are part of
the hit target. It failed, and the obvious reading was that the click never
reached the control. It had; the callback simply had not run yet.

## What was measured

Clicking the hidden input of a checkbox, then sampling the callback count at
three points:

```
  synchronously after fireEvent.click   0
  after `await Promise.resolve()`       1
  after `await setTimeout(…, 0)`        1
```

The click itself is delivered synchronously — a listener attached to the input
fires, and the event bubbles to `document` — and the DOM has already updated:
`input.checked` is true at the moment the assertion runs. Only the callback is
deferred. The machine dispatches through `queueMicrotask`.

Worth recording separately: **the simulated DOM does implement activation
behaviour**, including forwarding a click on a `<label>` to the control it is
`for`. Clicking the option's *text* sets `radio.checked` synchronously. So the
half of the interaction most likely to be dismissed as unsupported by the test
environment works, and the half that looks like plain JavaScript does not.

## Why one microtask and not a timer

Waiting on a microtask is not a "give it time" sleep. The callback is queued
during the event, so it is guaranteed to have run by the end of the current
task — a bare `await` is exact, and a `setTimeout` is the same guarantee with
noise. Anything that needs a real timer is a different bug.

## Gotchas

**The failure is one-directional and the safe direction is the loud one.**
`expect(cb).toHaveBeenCalled()` fails, and you go and look. `expect(cb).not
.toHaveBeenCalled()` — asserting that a disabled control ignores a click, that
a read-only one refuses — passes without the event having been processed at
all, and would pass with the handler deleted. Every negative assertion about
one of these callbacks needs the flush *more* than the positive one does.

**Assert the argument, not just the call count.** These callbacks receive a
details object (`{ checked }`, `{ value }`, `{ pressed }`), and a test that only
counts calls cannot tell a control that reported the wrong value from one that
worked.

**A visible DOM change is not evidence the callback ran.** The input's
properties are updated by the platform's own activation behaviour, before any
of the library's code is involved.

## Used in

`src/components/forms/controls.test.tsx` — the `settled()` helper and the
radio-group hit-target case.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]]
- [[ark-draws-states-it-does-not-announce]]
- [[a-solid-component-under-vitest-renders-to-nothing-by-default]]
