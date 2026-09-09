# A live region must exist before the thing it announces

Assistive technology watches regions that are already in the accessibility
tree, so a region mounted in the same update as its message frequently
announces nothing — which makes the natural spelling, `{error && <Alert
live="assertive">…</Alert>}`, the one that silently does not work.

**Origin** — building an alert with a `live` prop, and having to decide what
the component could honestly promise. It can carry the role; it cannot make the
role function, because whether it works is a property of WHERE the element is
mounted, which belongs to the screen.

## The shape

A live region is not a message. It is a *subscription*: a standing instruction
to watch a node and report what changes inside it. Everything follows from
that.

```
  mounted empty at load, filled later     announced
  mounted already containing the text     nothing to report — it did not change
  mounted and filled in one update        usually nothing; the watch began too late
```

The third row is the trap, and it is the shape every declarative framework
makes most natural, because conditional rendering is how everything else is
expressed. There is no error, no warning, and no visual difference — the alert
appears exactly as intended for anyone looking at it.

The fix is not a different attribute. It is to render the container
unconditionally and change only its contents:

```jsx
<div role="status">{message}</div>     // always mounted, empty until there is something
```

## Two consequences for how it gets designed

**Absent by default.** A live region promises its contents are NEW. Most
messages on a page were there when the page loaded, and marking those live
costs something real: an assertive region that is always present trains a
person to ignore the one that matters, and a polite one that was there at load
announces nothing anyway. Turning it on should be a statement that this message
*arrived*.

**A component cannot own the guarantee.** Which is why the honest design is for
a primitive to carry the role when asked and to document the condition, rather
than to appear to solve it. Anything else ships a component that promises an
announcement it cannot make.

## Prefer the role to the bare attribute

`role="alert"` implies `aria-live="assertive"` *and* `aria-atomic="true"`;
`role="status"` implies the polite pair. The atomic half is the one people miss
reaching for `aria-live` alone — without it a reader announces the DIFF, so a
single changed word arrives with no sentence around it and is unintelligible.

## The mirror case: a picture of content is not a status

The same group produced the inverse mistake. A skeleton is decorative and is
therefore `aria-hidden` — reading "blank blank blank" to somebody is worse than
reading nothing.

The consequence is easy to miss: **a screen full of skeletons announces nothing
at all.** A reader is told the page has loaded, finds no content, and cannot
tell whether to wait or to leave. The stand-in has replaced the announcement
with a picture of one.

So a loading state needs saying as well as drawing — `aria-busy` on the region
being replaced, a live region, or a visible label. And the component should not
choose, because building one in makes the wrong one automatic and the failure
is silent.

## Gotchas

**Emptying and refilling in one update is the same bug.** Replacing the text
with new text works; removing the region and adding it back does not, even
when the markup looks identical afterwards.

**Support varies and the failure is one-directional.** Some combinations
announce a late-mounted region. Testing on one and concluding it works is how
this survives — the safe construction costs nothing and does not depend on
which reader is in use.

**Nothing in a test suite catches it.** The DOM is correct in both spellings,
the role is present in both, and the difference is entirely in when the node
appeared relative to a watcher that only real assistive technology installs.
This is a review-time and design-time rule, not an assertable one.

**"Loading" and "empty" and "failed" are three different announcements.** A
skeleton left on screen after a failure is the page that loads forever: nothing
is visibly wrong and nothing will ever change.

## Used in

`src/components/feedback/alert/` — the `live` prop, absent by default, carrying
the role and documenting what it cannot guarantee; and
`src/components/feedback/skeleton/`, which is `aria-hidden` and says in its own
doc that the caller must announce the loading state.

## Related

- [[containment-is-not-naming]]
- [[a-distinction-survives-only-if-the-renderer-requires-it]]
- [[a-check-that-cannot-fail-is-not-a-check]]
