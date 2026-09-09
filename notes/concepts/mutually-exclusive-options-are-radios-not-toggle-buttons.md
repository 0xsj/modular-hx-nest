# Mutually exclusive options are radios, not a row of toggle buttons

`aria-pressed` describes each button on its own, so N buttons with one pressed
is announced as N independent two-state controls that happen to be adjacent —
nothing says they are alternatives, that exactly one is chosen, or how many
there are. The two look identical on screen.

**Origin** — a segmented control for the theme, built first as three buttons
with `aria-pressed` because that is the shape the markup falls into.

## What each one actually says

```
  three buttons, aria-pressed      "Light, toggle button, pressed"
                                   ...and nothing about the other two

  a radio group of three           "Theme, Light, radio button, 2 of 3"
```

The radio version carries the set's name, the position, and the count. A user
who cannot see the control learns from the announcement that there are three
options and which one is current — which is the entire content of a segmented
control, and none of it is in the first version.

There is a second, practical difference: the group is **one tab stop** with
arrows moving inside it. A row of buttons is N tab stops, so passing a
four-option filter on the way to the content costs four presses.

## Where toggle buttons ARE right

Not never — the distinction is whether the options are alternatives.

```
  independent, each on or off     toggle buttons   Bold, Italic, Underline
  one of a set                    radio group      Light / Dark / System
```

The formatting marks are genuinely separate two-state controls, and
`aria-pressed` describes them exactly. That is why the design system has both a
`Toggle` and this, and why neither is a variant of the other.

## And a radio group is not automatically a form field

Radio SEMANTICS and form BEHAVIOUR are separable. A segmented control applies
on press; a radio group in a form waits for a submit. The markup is nearly the
same and the promise is not — the same distinction a switch and a checkbox
make, one control over.

The test is the one that keeps recurring: **is there something to submit
afterwards?**

## Gotchas

**The keyboard contract is the reason to use a library.** Roving tabindex —
exactly one member tabbable, moving with the selection — is easy to get wrong,
and the failure is a control that cannot be reached or cannot be left.

**The focus ring needs somewhere to live.** These are usually built with a
visually hidden input and a styled label, so the input's own ring is invisible.
Put the ring on the visible element (`:has(:focus-visible)` reaches it from
the label) or the control is operable and shows nothing.

**"Nothing selected" is usually not a state to model.** A segmented control
always has exactly one member chosen, so a library's `null` for a cleared
selection is a case no caller can produce — dropping it beats widening the
callback's type to include it.

## Used in

`src/components/chrome/segmented/` — radio semantics, a required group label,
and the ring on the item; used by the theme and density controls, and
contrasted with `src/components/forms/toggle/`, which is the independent case.

## Related

- [[a-preference-that-defers-to-the-platform-needs-a-third-state]]
- [[containment-is-not-naming]]
