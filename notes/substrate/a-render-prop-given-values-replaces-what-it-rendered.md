# A render prop handed values replaces its element; handed getters it updates it

In a system with no re-render, reading a value while building the object you
pass to a render prop moves the subscription up to the call site — so the
callback re-runs and the DOM node it returned is discarded. The attributes end
up correct either way, and that is precisely why nobody catches it.

**True of `solid-js` 1.9.14 · verified 2026-09-09 — measured.**

**Origin** — a `Field` that owns a label, a hint, an error and the wiring
between them, handing the control's props to a caller to spread. It behaved
correctly under every assertion written for it. What it actually did was
destroy the input and build a new one each time the error changed.

## What was measured

The component, in the shape that looks obviously right:

```jsx
{props.children({
  id,
  "aria-describedby": describedBy(),
  "aria-invalid": props.error ? true : undefined,
})}
```

Type into the field, focus it, then set the error:

```
  render-prop invocations   2
  same element              false
  typed value survived      ""       (was "ops@")
  focus survived            false
```

The same test against an object whose properties are getters, called once:

```
  render-prop invocations   1
  same element              true
  typed value survived      "ops@"
  focus survived            true
```

Both versions produce identical markup. Every attribute assertion passes on
both — `aria-invalid` appears, `aria-describedby` lists the error before the
hint, and both are removed again when the error clears.

## Why

A component body runs once. Reactivity lives in the computations the compiler
wraps around dynamic JSX positions, and `{props.children(...)}` is one of them.
Building the argument *inside* that call reads the signals inside that
computation, so the computation now depends on them — and the only thing it
knows how to do when they change is run again, which means calling the render
prop again and inserting whatever it returns.

Behind getters, nothing is read at call time. The values are read later, by the
spread on the caller's element, which is its own render effect — so the
dependency is registered one level down and the update is an attribute write on
the node that is already there.

## How the update actually reaches the element

Worth tracing once, because the fix only holds if every link preserves the
getter — and each link is a place where a reasonable-looking refactor would
evaluate it:

```
  const control = { get "aria-invalid"() { … } }   an object of GETTERS
  props.children(control)                          called once, reads nothing
  <Input {...control} />                           spread -> a render effect
    splitProps(props, ["class"])                   PROXIES, getters preserved
    <input {...rest}>                              read here; subscription forms HERE
```

Two properties of the framework are doing the work. `splitProps` returns
proxies rather than copies, so a wrapper component can take props apart and
hand the remainder on without collapsing any of them to values. And a spread
onto an element compiles to a render effect that re-reads every key, so the
subscription forms at the innermost read — on the attribute, on the element
that already exists.

**Anything in that chain that evaluates rather than forwards moves the
subscription back up.** Destructuring the props object, spreading it into a
literal (`{...control}` into a new object), passing it through a helper that
copies keys, or calling `JSON`-anything — each is the same bug re-introduced,
and each still renders correct markup.

The general shape, which is not specific to this framework: **in a fine-grained
system the subscription forms wherever the read happens, so passing an
evaluated value across a callback boundary drags the subscription up to the
caller.** Anything downstream of that boundary is then rebuilt rather than
updated.

## Gotchas

**Correct output is not evidence.** This is the failure mode's whole character
— the rendered result is right, so a test asserting attributes passes on the
broken version. The observable difference is element *identity*, and nothing
about the markup shows it.

**What is lost is what the platform owns, not what the framework does.** An
uncontrolled value, focus, selection and cursor position, scroll offset inside
a textarea, an in-flight IME composition, a `ref` the caller is holding. A
controlled input restores its value and still loses the rest, which makes this
even harder to spot.

**The timing is the worst possible.** Validation state changes on blur or on
submit — so the control is replaced at the exact moment a user has just
finished typing into it.

**A test must capture the element before the change.** Re-querying the
container afterwards finds the replacement and reports everything as fine. Hold
a reference, then assert it is still the one in the document.

**A library that hands over a function is doing this deliberately.** Ark's
`asChild` gives the caller `(userProps) => mergedProps` rather than an object,
which is the same defence one level out — the caller triggers the read inside
their own element's computation.

**Destructuring props is the same mistake with a different name.** The
framework's rule against it is usually taught as "you lose reactivity", which
sounds like a value stops updating. This is what it actually looks like in a
component that *does* update: the read moves to the wrong computation, and what
you lose is the DOM node.

## Used in

`src/components/forms/field/field.tsx` — the `control` object's getters and the
single `props.children(control)` call. Pinned by the "a late error updates the
control, it does not replace it" cases in `field.test.tsx`, which assert
element identity, the typed value and focus rather than the attributes.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]]
- [[ark-aschild-hands-the-props-over-and-drops-the-ref]]
- [[a-zag-callback-settles-on-a-microtask]]
