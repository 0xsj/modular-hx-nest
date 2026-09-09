# `ComponentProps<typeof X>` erases a generic component's type parameter

Aliasing a component's props with `ComponentProps` resolves its type parameter
to `unknown`, and where that parameter sits in an invariant position the alias
becomes a type no caller can satisfy — a wrapper that compiles cleanly and
accepts nothing.

**Origin** — a `Select` wrapper whose props were `ComponentProps<typeof
Ark.Root>`. Every call site failed with

```
  ListCollection<{ label: string; value: string }>
    is not assignable to ListCollection<unknown>
```

The wrapper had been written, typechecked and reviewed before anything called
it, so the error arrived with the first real use.

## What is happening

`typeof X` for a generic function component is a generic signature. Passing it
through a props helper instantiates it, and with nothing to infer from, the
parameter resolves to its constraint or to `unknown`:

```ts
const Root: <T extends Item>(props: RootProps<T>) => Element

type P = ComponentProps<typeof Root>   //  RootProps<unknown>
```

That alone would be survivable. What makes it fatal is where `T` appears. A
container that both accepts and produces `T` is **invariant** in it, so
`Box<Concrete>` is not assignable to `Box<unknown>` — the direction that feels
safe is the one the checker refuses, because a `Box<unknown>` could be written
to with anything.

The fix is to carry the parameter rather than resolve it, which means the
wrapper is generic too:

```ts
export type SelectProps<T extends Item = Item> = SelectRootProps<T>
export function Select<T extends Item>(props: SelectProps<T>) { … }
```

Libraries that ship a generic root export the props interface by name for
exactly this reason. Reach for it before reaching for the helper.

## Why the error appears far from the cause

Nothing is wrong at the definition. `RootProps<unknown>` is a perfectly valid
type, the component body typechecks, and a test that renders the component with
no collection passes. The type only becomes unusable at a call site that has a
real one — so the distance between the mistake and the diagnostic is however
long it takes to write the first genuine caller.

That is the argument for building the caller early, and it is the same argument
`CLAUDE.md` makes about modelled tiers with no callers: a shape nothing has
reached is a shape nobody has checked.

## Gotchas

**A covariant parameter hides this completely.** If `T` only appears in output
positions the assignment to `unknown` succeeds, the wrapper works, and the type
parameter is silently gone — so callers lose inference on the value they get
back and nothing points at why.

**A default on the alias is not a fix, it is a fallback.** `SelectProps<T = Item>`
keeps the bare `SelectProps` spelling usable in a barrel; the function still has
to be generic or the parameter is resolved again at the call.

**Do not reach for a cast.** Widening the collection to `unknown` at the
boundary compiles and throws away the item type for every consumer downstream,
including the render props that were the reason for the generic.

## Used in

`src/components/forms/select/select.tsx` — `SelectProps<T>` and the generic
`Select`.

## Related

- [[ark-aschild-hands-the-props-over-and-drops-the-ref]]
