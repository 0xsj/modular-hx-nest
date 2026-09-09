# An observer that watches what it renders needs a key guard

A view derived from the DOM will re-derive itself forever unless the write is
gated on something that actually changed — and the symptom is not a wrong view,
it is a page that never finishes loading.

**Origin** — a showcase page whose section rail is read out of the rendered
document (`[data-section]`, `[data-case]`) rather than declared beside it, so
that a case cannot exist and be unreachable. It worked, and the browser never
went idle: a probe waiting on network-idle timed out at 30 seconds with nothing
visibly wrong on screen.

## The loop

```
  rebuild()  ->  writes the derived list into state
             ->  the nav re-renders its links
             ->  the DOM mutates
             ->  the MutationObserver fires
             ->  rebuild()
```

Nothing in it is wrong in isolation. The loop exists because the derived view is
**inside the subtree it observes**, so its own output is indistinguishable from
the input it is watching for.

## The guard

Fire the observer freely; write only when the derivation changed. Compare a flat
key rather than the structure:

```
  key = every observed element's id, joined
  if (key === last) return
```

The key has to be over the *derived* value, not over the observer's record list
— records arrive for every mutation including the ones this code caused, which
is the thing being filtered out.

## It is framework-independent, and the reason differs per framework

The same code in a hooks-based framework needs the same guard for a different
reason: a subscription whose snapshot returns a fresh array returns a new
identity on every call, and the comparison that decides whether to re-render
never says "unchanged". Reactive-signal frameworks have no identity comparison
at all — a write is a write — so the guard has to be explicit rather than
inherited from the runtime.

Two different mechanisms, one rule: **a derived view that contributes to its own
input must compare before it writes.**

## Gotchas

**The tell is a timeout, not a visual defect.** The nav is correct. Anything
waiting for quiescence — a screenshot driver, a network-idle wait, a hydration
check — is what notices, and it reports the wrong thing.

**Narrowing the observed root does not help** if the rendered output is inside
that root, which for a nav derived from the page it decorates it usually is.

**It is invisible in development** unless something waits for idle. The page
paints, scrolling works, and the loop is a background cost nobody sees.

## Used in

`src/routes/kitchen-sink/_components/case-nav.tsx`.

## Related

- [[read-a-computed-style-after-the-transition-settles]]
