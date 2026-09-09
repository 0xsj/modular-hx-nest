# An Ark root `id` is a seed, not the control's id

Every id in one of these components is derived from the root's, so passing
`id="agree"` produces `checkbox:agree:input` on the actual input and leaves a
caller's `<label for="agree">` pointing at nothing — a control with no
accessible name, in the one place a reviewer is least likely to check.

**True of `@ark-ui/solid` 5.39.1 / `@zag-js/*` 1.43.3 · verified 2026-09-09 —
measured.**

**Origin** — auditing a rendered showcase page for unresolved IDREFs. Ten
`<label for>` attributes pointed at ids that did not exist in the document. The
markup had been reviewed, the components had tests, and every control looked
correctly labelled on screen.

## What was measured

The dom module is explicit — every part id is a template over the root's:

```js
var getRootId        = (ctx) => ctx.ids?.root        ?? `checkbox:${ctx.id}`
var getLabelId       = (ctx) => ctx.ids?.label       ?? `checkbox:${ctx.id}:label`
var getControlId     = (ctx) => ctx.ids?.control     ?? `checkbox:${ctx.id}:control`
var getHiddenInputId = (ctx) => ctx.ids?.hiddenInput ?? `checkbox:${ctx.id}:input`
```

So `id` names the *machine instance*, not an element:

```
  <Checkbox id="agree" />
    root  <label id="checkbox:agree" for="checkbox:agree:input">
    input <input  id="checkbox:agree:input">
    a caller's <label for="agree">  ->  resolves to NOTHING
```

The `ids` object is the override, and `ids.hiddenInput` is the one worth
setting: it moves the input's id **and** the root's own `for` together, so the
component stays internally consistent while `id` comes to mean what it means on
a native control.

## Why this bites harder than a normal naming mistake

**It is invisible in every rendering.** The control draws correctly, the words
sit beside it, and a sighted click still works — because the root element is
itself a `<label>` wrapping both. Only the caller's separate label is dead.

**It survives a component's own tests.** A test that renders the component
alone has nothing to point at it, so the defect lives entirely in the seam
between two correct components.

**It propagates through any generic wiring component.** Anything that owns an
id and hands it to a caller to spread — the usual field/label/description
wrapper — silently produces the same dangling reference for these controls
while working perfectly for a native `input`. The abstraction that exists to
make labelling uniform is the one that breaks first.

## Gotchas

**A dangling `aria-labelledby` is not the same failure, and mostly is not one.**
These components emit `aria-labelledby` aimed at a label part a wrapper may not
render. Measured: the name computation skips the unresolvable reference and
falls through, so a native `<label for>` or an `aria-label` still names the
control. Do not "fix" it by suppressing the attribute.

**Query by role, not by label text, when checking this.** `getByLabelText`
answered NO for a control that `getByRole(name)` — and therefore the
accessibility tree — answered YES for. The role query is the one that reflects
what a reader gets.

**Audit for unresolved IDREFs on rendered output, not in review.** Every
instance here was a string that looked right next to a string that looked
right. Collecting the document's ids and diffing them against every `for`,
`aria-labelledby` and `aria-describedby` finds the whole class in one pass, and
is the only reason these were found at all.

## Used in

`src/components/forms/checkbox/checkbox.tsx` and
`src/components/forms/switch/switch.tsx`, which map `id` onto
`ids.hiddenInput`; pinned by the "a sibling Label names the control" cases in
`src/components/forms/controls.test.tsx`, including the one that goes through
the field wrapper.

## Related

- [[ark-draws-states-it-does-not-announce]]
- [[containment-is-not-naming]]
- [[a-check-that-cannot-fail-is-not-a-check]]
