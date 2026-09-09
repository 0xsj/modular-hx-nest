# Ark's checkbox and switch draw states they do not announce

Both controls render the same bare `input type="checkbox"`, so a switch is
announced as a checkbox and an indeterminate checkbox as unchecked — the third
state and the role live in `data-state`, which styles a control and tells a
screen reader nothing.

**True of `@ark-ui/solid` 5.39.1 and `@zag-js/checkbox` 1.43.3 · verified
2026-09-09 — measured by rendering it and reading the DOM, not read.**

**Origin** — a test on the forms group asserting `aria-checked` on a checkbox
got `null`, and one querying `role="switch"` found no element at all. Both
components looked right on screen and had looked right in review.

## What was measured

Rendering `<Checkbox checked="indeterminate" />` and `<Switch checked />` and
dumping the tree gives, in both cases, a visually-hidden native input with no
role and no `aria-checked`:

```html
<label data-part="root" data-state="indeterminate">
  <div data-part="control" aria-hidden="true"> …the glyph… </div>
  <input type="checkbox" value="on">   <!-- .checked=false .indeterminate=false -->
</label>

<label data-part="root" data-state="checked">          <!-- the SWITCH -->
  <span data-part="control" aria-hidden="true"> …the thumb… </span>
  <input type="checkbox" value="on">   <!-- no role="switch" -->
</label>
```

The control that carries the appearance is `aria-hidden`, so everything a
reader gets comes from that input. Two separate gaps land there:

**The switch has no role.** Nothing in the library distinguishes the two
controls in the accessibility tree — only `data-scope` and the stylesheet.

**`indeterminate` is synced on change, never on mount.** The machine has the
action (`checkbox.machine.mjs`):

```js
syncInputElement({ context, computed, scope }) {
  const inputEl = dom.getHiddenInputEl(scope)
  setElementChecked(inputEl, computed("checked"))
  inputEl.indeterminate = isIndeterminate(context.get("checked"))
}
```

but the mount path renders `defaultChecked: checked` (`checkbox.connect.mjs`,
`getHiddenInputProps`) and nothing else. `checked` computes to `false` for the
indeterminate value, so a control rendered indeterminate draws the dash and
reports "not checked" until something changes it. A control that is never
touched never gets corrected.

## Why this is the dependency's shape and not a bug to wait out

Handing the whole announcement to a real input is the right call — it is what
makes these submit, respond to a form reset, and inherit `:disabled` from a
fieldset. The cost is that everything ARIA-shaped becomes markup the caller
owns, and the library has no way to know that this particular checkbox is a
switch.

Which means the wrapper is the only place it can be fixed, and a wrapper that
does not is shipping a control whose appearance and announcement disagree.

## The shape the fix has to take

A property that cannot be rendered has to be *assigned*, which means a handle
on the element and something that re-runs when the value changes:

```jsx
<Ark.Context>
  {(api) => {
    let input!: HTMLInputElement;
    createEffect(() => { input.indeterminate = api().indeterminate; });
    return <Ark.HiddenInput ref={input} />;
  }}
</Ark.Context>
```

Three things about this are framework-specific and all three are load-bearing.
The `ref` is assigned during element creation, and effects run after the tree
is mounted — so reading `input` inside the effect is safe even though the
assignment appears textually later. The effect is created inside the render
prop, which runs under the surrounding component's owner, so it is disposed
with the component rather than leaking. And the value is read from the
library's api inside the effect, which is what makes the effect re-run: reading
the *prop* instead would cover only the controlled case, and reading it outside
the effect would subscribe nothing at all.

The context component exists because the state has to come from the machine
rather than from props. It is the same reason in both directions — the library
owns the truth, and the wrapper's job is to publish it somewhere a reader can
see.

## Gotchas

**`indeterminate` cannot be rendered.** It is a property with no attribute
form, so no amount of JSX sets it — it has to be assigned to the element, which
means a ref and an effect. This is also why `aria-checked="mixed"` is not the
fix: ARIA in HTML prohibits `aria-checked` on a native checkbox, and the
accessibility tree reads the property regardless.

**Read the state from the library's api, not from the prop.** An uncontrolled
control has no prop to read, and syncing from one silently covers only half the
callers.

**`role="switch"` on `input type="checkbox"` is valid** — `switch` is a subclass
of `checkbox`, and the native checked state supplies `aria-checked`, so nothing
needs to mirror it.

**A `data-state` attribute is not evidence of an announcement.** Every part in
this library writes one, and it is the attribute a demo page and a stylesheet
both look correct against. The test that separates them is to query by role and
read the native properties.

## Used in

`src/components/forms/checkbox/checkbox.tsx` — the `Context`/ref effect that
assigns `indeterminate`; `src/components/forms/switch/switch.tsx` — the
`role="switch"` on the hidden input. Both are asserted in
`src/components/forms/controls.test.tsx`.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]]
- [[a-zag-callback-settles-on-a-microtask]]
- [[ark-aschild-hands-the-props-over-and-drops-the-ref]]
