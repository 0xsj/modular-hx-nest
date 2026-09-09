# A key list must be a const tuple, or the split returns an empty remainder

A helper that removes keys from an object types the leftovers from the
*literal* keys it was handed. Widen that list to `(keyof T)[]` and the helper
concludes every key was removed, so the remainder is `{}` — and the error
surfaces as an impossible-looking cast failure in a line that mentions neither
the array nor the widening.

**Origin** — a spacing API with fourteen props to strip off before the rest can
be spread onto an element. The key list was built with `Object.keys(...) as
(keyof SpaceProps)[]`, which reads as tightening a type and is the opposite.

## What the checker actually said

Two rounds, both far from the cause. First:

```
  Conversion of type
    '[Pick<T, Extract<(keyof SpaceProps)[], readonly (keyof T)[]>[number]>, …]'
  to type '[SpaceProps, Omit<T, keyof SpaceProps>]' may be a mistake
```

then, after "fixing" it with a cast to `readonly (keyof T)[]`:

```
  Conversion of type '{ [P in keyof T as Exclude<P, keyof T>]: T[P]; }'
  to type 'Omit<T, keyof SpaceProps>' may be a mistake
```

The second is the diagnosis, spelled out: `Exclude<P, keyof T>` is `never` for
every `P`, so the remainder is the empty object. Told that the removed keys are
"some keys of T", the helper can only conclude that all of them might be — so
nothing is left to spread, and the component can no longer pass anything to the
element it renders.

The fix is not a better cast. It is to stop widening:

```ts
const SPACE_KEYS = [
  "p", "px", "py", /* … */
] as const satisfies readonly (keyof SpaceProps)[];

// no cast anywhere
return splitProps(props, SPACE_KEYS);
```

`as const` keeps the literal tuple; `satisfies` checks every entry really is a
key without widening the type to the thing it was checked against. Both halves
are needed — `as const` alone lets a typo through, and an annotation alone
throws away the literals.

## Why the cast felt right

`Object.keys` returns `string[]`, which is genuinely too loose, so casting to
`(keyof X)[]` looks like the standard remedy — and for a value you only iterate,
it is. It goes wrong when the array is an ARGUMENT whose element types drive a
conditional type in the callee's signature. There the literals are the
information, and the cast is what destroys it.

**The tell:** the helper's return type is computed from the argument, and the
error mentions `Exclude`, `Omit` or `never` in a position you never wrote.

## Gotchas

**Deriving the list from another object reintroduces it.** `Object.keys` of a
property map is `string[]` again, and the order is a guarantee about the object
rather than about intent. Writing the tuple out by hand is not duplication; it
is the only place the literal types and the deliberate order exist.

**`satisfies` is the part that keeps the two in step.** A hand-written tuple can
drift from the type it is supposed to cover, and `satisfies` catches the entry
that is no longer a key. It does not catch a *missing* one — that needs an
exhaustiveness check, and is worth adding only where forgetting a key is
silent.

**The failure is not a runtime bug, it is a wall.** Nothing ships broken,
because it does not compile. The cost is entirely in the time spent reading a
type error whose subject is three inference steps from the mistake — which is
the argument for suspecting the argument's type before the callee's.

## Used in

`src/components/style-props.ts` — `SPACE_KEYS`, written out by hand with `as
const satisfies`, and `splitSpace`, which needs no cast because of it.

## Related

- [[componentprops-of-a-generic-component-erases-the-parameter]]
- [[a-style-object-is-applied-in-insertion-order]]
- [[a-render-prop-given-values-replaces-what-it-rendered]]
