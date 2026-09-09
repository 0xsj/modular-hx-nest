# Containment is not naming

Putting a control inside a named container does not give the control a name —
the container gets one, and the element with the role a reader is about to
announce still has none. The composition that reads as obviously sufficient is
the one that fails.

**Origin** — a radio group wrapped in a fieldset with a legend, in a component
whose own documentation asserted that the legend was the group's name. It was
not, and the assertion had been written down and believed.

## What was measured

```
  <fieldset><legend>Retention</legend>
    <div role="radiogroup"> …options… </div>
  </fieldset>

  role="group"       named "Retention"     <- the fieldset
  role="radiogroup"  named ""              <- the element that matters
```

The legend names the `fieldset`. The `radiogroup` is a *different element*
inside it, and nothing propagates downward. A reader entering the region
announces the fieldset's legend, which is why this is easy to test by ear and
conclude it works — the question does get spoken, just not as the group's name.

Giving the group its own `aria-label` names it, and the two coexist.

## Why the mistake is structural

An accessible name is computed **per element**. Nothing about the tree is
inherited: not from a parent, not from a heading above, not from a legend, not
from a caption or a surrounding landmark. Every relationship that does carry a
name is an explicit one — `for`, `aria-labelledby`, `aria-label`, the element's
own contents.

So the reliable question is never *is this control inside something that
explains it*. It is:

```
  which element carries the role?
  what is THAT element's computed name?
```

Everything else is context, which is real and valuable and is not a name.

## The same rule read backwards: fragments speak unless something stops them

If a container does not name its children, it follows that an unnamed
container does not SILENCE them either. A component assembled from parts is
several objects in the accessibility tree until it is deliberately made into
one.

Measured, on an avatar built as a circle containing initials:

```
  <span>                          nothing
    <span>AK</span>               announced: "A K"    two letters, no meaning
```

The letters are a visual shorthand for a name the reader can already get from
the text beside it. Spoken individually they are noise, and worse than nothing
because they interrupt.

Collapsing it into one object takes both halves — a role and a name on the
wrapper, and everything inside hidden:

```
  <span role="img" aria-label="Ada Byron King">
    <span aria-hidden="true">AK</span>
  </span>
```

The same reasoning decides the image variant: `alt=""`, not the name. The
wrapper already carries it, and a second copy has the reader say it twice.
"Empty alt" is usually shorthand for *decorative*; here it means *named one
level up*, which is a different and more common reason than it gets credit for.

**The test in both directions is the same one.** Ask which element carries the
role, and what its name is. A container with a name whose child has the role is
the first failure; a child with content whose parent has no role is the second.

## Gotchas

**A wrapper can move the role away from the element you labelled.** A library
that puts `role="radiogroup"` on an inner div rather than on the element you
passed props to has silently separated the two, and the markup gives no sign.

**Redundant naming is the cheaper error.** Naming the group *and* the fieldset
the same words costs a repeated announcement; naming only the container costs
the name entirely. When unsure, name the element with the role.

**An unresolvable `aria-labelledby` falls through rather than blanking.** Also
measured: a reference to an id that does not exist is skipped, and the name
computation continues to the next source — a native `<label for>`, then
`aria-label`. So a dangling reference is not automatically a missing name, and
a missing name is not automatically a dangling reference. Check the computed
name, not the attributes.

**Verify by role and name together.** Querying for the role alone finds the
element and says nothing about whether it is announced as anything;
`role + name` is the assertion, and it is the one that fails when a legend has
been mistaken for a label.

## Used in

`src/components/display/avatar/avatar.tsx`, which is one `role="img"` with the
full name and hides its own initials; and
`src/components/forms/radio-group/radio-group.tsx`, whose doc comment used to
claim the legend was the group's name and now states what was measured; the
`Radio group` and `Fieldset` cases of the kitchen sink, where every group
carries its own `aria-label`; and the "needs a name of its own — a fieldset
legend is not one" case in `src/components/forms/controls.test.tsx`, which
asserts the negative directly.

## Related

- [[an-ark-root-id-is-a-seed-not-the-controls-id]]
- [[ark-draws-states-it-does-not-announce]]
