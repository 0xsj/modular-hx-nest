# Accessibility

> **A floor every component clears before it ships, and two structural rules that
> make the worst defects unrepresentable rather than unlikely.**
> Use when adding an interactive primitive, wiring a form field, building an
> overlay, or reviewing a component that "looks fine". Ends in a detection
> mechanism per rule, and an honest list of what nothing detects.

**Adopt this when** the project ships interactive components at all. **It costs
you** three lint rules, two interaction tests per overlay, and a review pass that
cannot be automated. **Decline it** only for a surface with no controls — and
record that as a decision, because the usual reason a floor is skipped is that
nobody owns it, not that it does not apply.

---

## Why this one is different from every other quality rule

**Accessibility defects are the class of bug most likely to be invisible to the
person who introduced it.** A broken layout is visible to its author. A broken
label is not — the form renders, looks right, passes a screenshot review, and is
unusable with a screen reader.

So the emphasis here is not on knowing the WAI-ARIA spec. It is on **choosing
shapes that cannot silently lose the wiring**, because the feedback loop that
catches everything else does not operate on this.

---

## The floor

Not aspiration — the minimum for a component to ship.

| # | Rule | Detected by |
| --- | --- | --- |
| **A1** | Every interactive primitive is reachable and operable by keyboard | Test — axe, plus a tab-order assertion per primitive |
| **A2** | Focus is visible via the focus-ring token, never removed without replacement | Lint — `outline: none` with no sibling `:focus-visible` rule |
| **A3** | A disabled control is not focusable | Lint — a polymorphic control keeping `href` on a disabled branch |
| **A4** | A loading control sets `aria-busy` and keeps its accessible name | **Review** |
| **A5** | Colour is never the sole carrier of meaning — status pairs colour with an icon or text | **Review** |
| **A6** | Icon-only controls carry an accessible name | Lint — a control whose only child is an icon and which has no accessible name |
| **A7** | Anything portalled restores focus to its trigger on dismiss | Test — one interaction test per overlay |

**A3 is the one that gets written wrong.** Dimming a control is not disabling it.
An anchor with `pointer-events: none` is still in the tab order and still
activates on Enter — so a polymorphic control that becomes an anchor must **drop
`href`** when disabled, not just style it as inert.

---

## Do not reimplement the hard parts

Focus traps, dismiss layers, roving tabindex and portal ordering are solved
problems with long tails. Use the headless library.

- **The headless import lives in the primitive and nowhere above it.** A
  composition or a screen that imports it has skipped a tier.
- **The primitive owns styling and the token contract; the library owns behaviour
  and accessibility wiring.** That split is what makes the floor affordable.
- Where two frameworks' headless libraries diverge in API, **the divergence stops
  at the primitive.** Everything above sees one shape.

---

## Two structural rules

These are not conventions. Each removes a failure mode that produces no error.

### 1 · Hand the wiring over; do not reach in

A field wrapper owns the label, the description, the error and the generated id.
Something must connect them to the control. Two ways:

```
  reach in     the wrapper clones the child and attaches id + described-by
  hand over    the wrapper passes a bag of props; the caller places them
```

**The first fails the moment the child is not the control.** Wrap it in a `<div>`
for a row, an adapter, a conditional fragment — and the props land on the
wrapper. The label's `for` now points at an id nothing has.

**Nothing errors.** This is the pattern that makes an invisible class of bug
specifically invisible.

Handing over cannot fail that way: a caller who wraps the control still has to
put the props somewhere, and the only place they type-check is on the control.

```
  origin   choosing between cloning and a render prop for a form Field.
           The silent-failure asymmetry ended the comparison
```

The durable benefit is the second one: **the wrapper never has to know what the
control is.** The contract is the bag of props, not a component type — so a
select, a combobox, a date field, none of which exist yet, need no change to the
wrapper. Cloning couples them, because the wrapper must know enough about the
child to decide what to attach.

- **The bag must be complete, or callers fill the gaps inconsistently.** Four
  things is usually the set: the **id**, the **described-by** string, **required**,
  and **invalid** derived from whether an error is present. Leaving `invalid` out
  because "the caller knows if it passed an error" produces two sources for one
  fact.
- **Order the described-by ids deliberately.** They are announced in the order
  listed, not in document order. **Error before hint** — somebody who has just
  failed validation hears what is wrong before the standing advice.
- **Do not replace the hint with the error.** The instruction is still true while
  the field is wrong, and swapping them removes it exactly when it is needed.
  Most form components do the opposite.

> **Framework note.** The mechanism differs — a render prop, a snippet, a
> function child — and the rule does not. What matters is that the caller places
> the props, not the wrapper.

### 2 · A primitive may not manufacture a handler

**Handlers are passed through, never created.** If a component was not given a
function, it does not attach one.

```
  origin   a Button that synthesised an onClick to swallow the event while
           disabled. It compiled. Every page rendering it then failed to
           prerender — "Event handlers cannot be passed to Client Component
           props"
```

The failure is worse than it sounds because **the error names the page and the
cause is a component two or three imports away.** Nothing in the message points
at the primitive, so whoever debugs it goes looking at the page's own boundary,
which is the one place the problem is not.

It also fails in the direction that hides. Adding a handler to make a component
*safer* — swallow the click while inert, guard a double submit — looks defensive
in review and is the change that breaks the build.

Express the state declaratively instead and let the platform enforce it:

```
  disabled          the real attribute. Unfocusable, unclickable, announced
  tabIndex={-1}     out of the tab order where the attribute does not apply
  pointer-events    off, from a data attribute the stylesheet reads
```

Three declarations, no function, and the component stays renderable on the server.

- **The declarative version is sometimes incomplete, and the honest move is to
  say so.** For a link styled as a disabled button, the above stops a click and
  stops tabbing, and does **not** stop Enter if something focuses it
  programmatically. Closing that gap needs the handler. The right answer is a
  rule about call sites — *do not render a link you do not want followed* —
  recorded where somebody reaching for that combination will meet it, not a
  handler that quietly costs every caller their server rendering.
- **A conditional handler is still a handler.** `onClick={inert ? swallow :
  props.onClick}` reintroduces the whole problem for the callers who hit the true
  branch, and does it non-deterministically.

> **The general form is broader than any framework.** A component that
> manufactures behaviour it was not asked for takes on a capability requirement
> its callers never agreed to. Here it is a runtime; elsewhere a context, a store,
> a lifecycle. The tell is the same: **a prop the caller never passed appears in
> the rendered output.**

---

## How the floor is actually checked

Accessibility is where "it renders" is least informative, so the verification
leans on [`render-verification.md`](render-verification.md):

- **Assert on accessible output, not class names.** Live regions, `aria-invalid`,
  `aria-describedby` and `id$="-error"` text are what a person receives, and they
  survive restyling. A test that asserts a class name passes on a component that
  announces nothing.
- **A2 is measurable, so measure it.** A focus ring is a contrast ratio against
  the surface behind it, not an impression. It belongs in the same sampled sweep
  as the text tokens.
- **A7 needs the hydrated page.** Focus restoration does not exist in
  server-rendered HTML or in a static probe. Drive it: open, dismiss, read
  `document.activeElement`.
- **`:focus` does not match in a headless browser without focus emulation.** A
  correct focus style measures as broken. When a focus assertion fails, rule out
  the instrument before the stylesheet.

---

## What nothing detects, and why

Naming these keeps them from being mistaken for guarantees.

| Rule | Why it resists detection |
| --- | --- |
| **A4** | Whether `aria-busy` is on the *right element*, and whether the name survives the loading state, are judgements about intent |
| **A5** | "Colour is not the only signal" needs someone to know what the signal means |
| **Density and zoom** | Tokens can be checked; whether compact mode is *usable* at 200% is visual |
| **Announcement order in practice** | The described-by order is assertable; whether the resulting sentence is comprehensible is not |
| **Screen-reader behaviour** | axe checks the tree, not what a given reader says about it. A clean axe run is a floor, never a pass |

**The last row is the largest gap and the one most often misread.** An automated
audit finds roughly the defects it has rules for. Reporting "0 violations" as
though it meant "accessible" is the same error as reporting a green build from a
harness that never ran.

A null result is a result: *"axe clean; no assistive-technology testing was done"*
is a finding. Silence in that place is a claim you did not make and cannot
support.

---

## Checklist

```
  [ ] every interactive primitive keyboard-reachable and operable      A1
  [ ] focus visible, from the token, never removed without replacement A2
  [ ] disabled controls drop href — not just pointer-events            A3
  [ ] loading sets aria-busy and keeps its accessible name             A4
  [ ] no status carried by colour alone                                A5
  [ ] every icon-only control has an accessible name                   A6
  [ ] every overlay restores focus to its trigger on dismiss           A7

  [ ] field wiring is handed to the caller, never cloned in
  [ ] the prop bag is complete: id, described-by, required, invalid
  [ ] described-by lists the error before the hint
  [ ] no primitive attaches a handler it was not given
  [ ] headless library imported in primitives only

  [ ] assertions read accessible output, not class names
  [ ] the focus-ring ratio measured, not eyeballed
  [ ] axe run — and reported as a floor, not as a pass
  [ ] what was NOT tested is written down
```
