# A distinction survives only if the renderer requires it

Careful modelling one tier down buys nothing on its own: a union that keeps
three cases apart is collapsed by one ternary at the point of render, and the
collapse is invisible because the output looks reasonable. The enforcement has
to be repeated by the component's props, or the type was decoration.

**Origin** — a kernel that goes to real trouble to keep *nobody looked* apart
from *looked and found nothing*: a dedicated combinator, a rule about which
failures may be narrowed, a three-way value. Then building the display group
and noticing that every one of those guarantees ends at

```jsx
{items.length ? <List items={items} /> : "—"}
```

which renders a failed request as an emptiness, in one line, silently.

## The shape

A distinction is created at some tier and consumed at another. Between them it
travels as a type, and a type only constrains code that has to name the cases.
The instant a value reaches a position where "truthy or not" is a legal
question, the union stops being load-bearing.

Rendering is where this happens, because rendering is where a value meets a
language construct that does not care what it is:

```
  the kernel      Result<T | null, E>       three cases, exhaustively
  a service       narrowed, still three
  a component     `value ? a : b`           two, and nobody was told
```

The failure has a characteristic look: **the wrong branch is plausible.** An
error rendered as "no results" is a sentence a reader believes, and unlike a
crash it produces no signal at all. That is what makes it worth designing
against rather than reviewing for.

## The fix is a required prop, not a convention

Make the component unable to render without being told what each case says:

```
  found        a function receiving the value, so it exists only in that branch
  empty        REQUIRED — no default is correct
  unmeasured   optional, because one honest generic sentence does exist
```

Requiring the empty case is the part that does the work, and the argument for
it is not that a default is hard to write. It is that **every default that
could be written is wrong**: a generic "No data" is the same sentence on every
screen, so the reader who has landed on the wrong one cannot tell — which is
the same class of failure one tier up.

The optional third is not a weakening. There genuinely is a correct generic
statement for *nobody measured*, because the user is not being told a number
that does not exist. Requiring it too would be ceremony, and ceremony is what
gets defaulted away.

## Why not enforce it in the type alone

An exhaustive switch is enforceable in the language, so it is tempting to leave
this to `assertNever` and be done. It does not reach: exhaustiveness constrains
code that *matches on the union*, and the collapsing ternary never does. It
tests a length, or a truthiness, on a value it obtained by other means.

The component's props are the last place the requirement can be expressed
where the compiler still sees it.

## Gotchas

**The render-side counterpart is easy to skip because it looks like styling.**
It sits in the component tier, gets grouped with badges and panels, and is
built last — by which point the modelling has been done, feels finished, and
this looks like a nicety.

**A default that "just shows a dash" is the same bug wearing a different
hat.** The three states become two the moment the third has an automatic
rendering nobody chose.

**Silence is the failure mode at the leaf, too.** A glyph that stands for
absence — an em dash — announces nothing at all, so the state that was
carefully preserved through four tiers is dropped in the last inch for anyone
not looking at the screen. Whatever marks the distinction visually needs a
second channel that says it in words.

**A distinction can also be lost UP the stack.** A `catch` that returns `[]`
destroys it before any renderer is involved, and no component API can recover
what arrived already collapsed.

## Used in

`src/components/display/presence/` — the component whose `empty` prop is
required and whose `children` is a function, and `src/components/display/stat/`,
where an unmeasured value renders as a dash for the eye and as "not measured"
for a reader. Both consume the three-way value built in `src/lib/kernel/`.

## Related

- [[containment-is-not-naming]]
- [[a-check-that-cannot-fail-is-not-a-check]]
