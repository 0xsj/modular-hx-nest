# A style object is applied in insertion order, so a shorthand can erase a longhand

Building inline styles from props looks order-free and is not: the declarations
are written to the element in the order the object's keys were inserted, so a
`padding` written after a `padding-block-start` silently discards the override
the caller asked for.

**Origin** — a spacing API where `p` sets `padding` and `pt` sets
`padding-block-start`. `<Box p={6} pt={0} />` was correct or broken depending
on the order of a key list in a different file, and both versions render
something plausible.

## What is happening

An inline style object becomes a sequence of declarations on one element, and
the cascade's last-wins rule applies within it. There is no specificity to
appeal to — every inline declaration has the same weight — so the only thing
separating `padding: 24px` from `padding-block-start: 0` is which was written
second.

```
  { "padding-block-start": "0", padding: "var(--space-6)" }   -> pt IGNORED
  { padding: "var(--space-6)", "padding-block-start": "0" }   -> pt applied
```

Both objects are equal by every structural comparison anybody would write, and
`Object.keys` order is the only difference.

So the rule for any prop-to-style mapping is: **emit broadest first.** The
shorthand, then the axis, then the individual sides. And the key order has to
be written down deliberately rather than derived — deriving it from the
property map with `Object.keys` makes the behaviour depend on a guarantee about
object literals rather than on stated intent, and the next person to alphabetise
that map breaks a caller with no test touching either file.

## Why it does not announce itself

The broken direction produces a correct-looking element. `p={6} pt={0}` renders
with padding on all four sides, which is exactly what somebody who forgot the
`pt` would expect to see. There is no warning, no duplicate-property error, and
the DOM inspector shows a single winning declaration with no sign that another
was overwritten.

## Gotchas

**Reading it back does not round-trip.** The CSSOM expands shorthands, so an
element given `flex: 1 1 0` serialises as `flex-grow: 1; flex-shrink: 1;
flex-basis: 0px`. A test asserting the string it wrote will fail against an
element that is entirely correct — assert the longhands, which are what the
element actually holds.

**`undefined` is not the same as absent, depending on the sink.** A key present
with an undefined value may still be written, and it can then take the position
that a later real declaration needed. Omit the key rather than setting it to
undefined.

**A caller's own style has to be spread last** to win, which means the
component's computed values must be spread first — the opposite of the ordering
instinct that puts "my defaults" after "their overrides".

**The same trap exists in every prop-to-CSS API**, including ones that emit
classes: if two utility classes set the same property, it is the STYLESHEET
order that decides, not the order of the class attribute — which is a different
rule for the same-looking mistake, and the reason class concatenation is not
precedence.

## Used in

`src/components/style-props.ts` — `SPACE_KEYS`, written out by hand
broadest-first with the reason stated, and asserted by the "orders the
shorthand before the longhand" case in
`src/components/layout/layout.test.tsx`.

## Related

- [[an-unresolved-var-poisons-the-whole-declaration]]
- [[a-check-that-cannot-fail-is-not-a-check]]
