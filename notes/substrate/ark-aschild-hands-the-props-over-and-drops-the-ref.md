# Ark's `asChild` hands the props over, and drops the ref on the way

A polymorphism API that hands props to the caller cannot lose them on a wrapper
the way a cloning one can — but this one also removes `ref` before the caller
ever sees it, so a component that dutifully forwards one is forwarding into a
void.

**True of `@ark-ui/solid` 5.39.1 and `@zag-js/solid` 1.43.3 · verified
2026-09-08 — measured by running it, not read.**

**Origin** — writing a Button whose `doc.ts` had to state the merge contract
precisely enough that a blackbox test could be written from it. Guessing at the
semantics would have put a wrong claim in a document whose whole value is being
independent of the code.

## What was measured

The factory (`@ark-ui/solid` → `chunk/UFYZ7HLU.jsx`) splits `asChild` off, then
hands the caller a function:

```js
const [localProps, parentProps] = splitProps(props, ["asChild"]);
if (localProps.asChild) {
  const propsFn = (userProps) => {
    const [, restProps] = splitProps(parentProps, ["ref"]);   // <- ref discarded
    return mergeProps(restProps, userProps);
  };
  return localProps.asChild(propsFn);
}
```

`mergeProps(parent, child)` run directly:

```
  mergeProps({class:'A', onClick:parent}, {class:'B', onClick:child})
    class    ->  "A B"
    onClick  ->  child runs FIRST, then parent
```

Which gives the full contract:

```
  ordinary props   the CALLER wins        last source defined wins
  class            CONCATENATED           parent's first, then the caller's
  style            merged
  on* handlers     COMPOSED               the caller's runs FIRST, then ours
  ref              STRIPPED               removed before the merge happens
```

## Why the shape matters more than the API

The alternative — clone the child and attach props to it — fails the moment the
child is not the element: wrapped in a fragment, a layout box, an adapter, and
the props land on the wrapper. It fails *silently*, which is what makes it
worth avoiding rather than merely worse. Handing the props over cannot fail that
way, because the caller has to put them somewhere and the only place they
type-check is on the element.

## Gotchas

**`ref` is not overridden, it is removed.** There is no ordering trick that
recovers it. A caller who needs a handle puts it on their own element.

**A component cannot force a prop onto the caller's element.** Ordinary props
are caller-wins, so passing `href: undefined` to strip an href does nothing.
Anything a component must guarantee has to be expressed some other way — an
attribute the stylesheet reads, or a rule about call sites.

**Handler composition is what lets a primitive refuse to manufacture handlers
and still compose.** The caller's handler is never discarded, so there is never
a reason to wrap it defensively.

**Class concatenation is not specificity.** The caller's class lands later in
the attribute, which decides nothing about which rule wins. With CSS Modules
they cannot collide anyway; precedence is the layer's job.

**Do not restate the signature by hand.** A hand-written
`(props: () => Record<string, unknown>) => JSX.Element` is not assignable to
Ark's, because a parameter type is contravariant and Ark passes
`(userProps?) => JSX.HTMLAttributes`. Alias the library's own type.

**A part that already renders an interactive element cannot wrap another
one.** A dialog's close trigger IS a `button`, so the composition that reads
naturally —

```jsx
<DialogClose><Button>Cancel</Button></DialogClose>     // button inside a button
```

— produces invalid HTML and two elements carrying the same accessible name.
Nothing errors; the page renders, and a role-and-name query finds two matches
where the author expected one. `asChild` is the answer and is what the API is
for:

```jsx
<DialogClose asChild={(p) => <Button {...p()}>Cancel</Button>} />
```

The general rule: whenever a library part is itself a control — a trigger, a
close, a menu item — composing a design-system control INSIDE it is nesting,
and handing the props over is the only correct shape.

## Used in

`src/components/forms/button/button.tsx`, the `asChild` branch; clauses B13–B16
of its `doc.ts`; and every trigger and close in `src/components/overlays/`,
where the nesting above is the failure it prevents.

## Related

- [[a-primitive-may-not-manufacture-a-handler]]
- [[solidstart-routes-a-file-only-if-it-default-exports]]
