# The router's link has three opinions, and a wrapper inherits all of them

`<A>` is not a thin anchor. It writes two global class names, it answers "am I
active" and "am I the current page" with *different* comparisons, and it merges
its own props after yours — so anything it decides cannot be overridden by the
component wrapping it.

**True of `@solidjs/router` (the version shipped with `@solidjs/start` 2) ·
verified 2026-09-09 — measured, and read from the implementation.**

**Origin** — building a nav link and a breadcrumb. Both wrap the same
component; only one of them can use it.

## 1 · The class names are global

```js
props = mergeProps({ inactiveClass: "inactive", activeClass: "active" }, props)
```

Left alone, every link in the application carries the unscoped class `active`
or `inactive`. In a codebase styled entirely with hashed modules those are the
only two global class names in existence, free to be matched by any stylesheet,
any dependency, and any future rule.

Pass your own. Removing the two props from the wrapper's public type stops a
caller putting them back.

## 2 · "Active" and "current page" are different comparisons

The memo returns a PAIR, and the two halves are used for different things:

```js
return [
  props.end ? path === loc : loc.startsWith(path + "/") || loc === path,  // -> classes
  path === loc,                                                           // -> aria-current
]
```

So `activeClass` is a **prefix** match (unless `end`), and `aria-current="page"`
is **exact, always** — `end` does not affect it.

This is correct and worth understanding rather than working around: on
`/sites/eu-west` the `/sites` item should stay lit, because you are inside it,
and must not announce itself as the current page, because you are not on it.

**The consequence for a wrapper: do not set `aria-current` yourself.** The
obvious implementation — compare href to pathname, write the attribute —
collapses the two questions into whichever one you happened to implement.

## 3 · Its props win, so `aria-current` cannot be overridden

```js
spread(el, mergeProps(rest, { href, state, classList, link: "", "aria-current": … }))
```

The caller's `rest` is the FIRST source, the router's object the last, and last
wins. A component that needs to control `aria-current` therefore cannot use
`<A>` at all.

That is a real case, not a hypothetical: a breadcrumb's whole contract is that
exactly one step claims to be the current page. Give it a trail where an
intermediate href equals the current URL and the router adds a second claim,
silently, in a component built to prevent exactly that.

**Plain anchors are routed anyway.** `explicitLinks` defaults to false and the
click handler walks the composed path for any `A` element, so an ordinary
`<a href>` navigates client-side. The `link` attribute `<A>` adds only matters
when a project opts into `explicitLinks`, where these degrade to full page
loads — correctness preserved, speed lost.

## Gotchas

**A link to `/` is active on every route.** The path is normalised and its
trailing slash stripped, so `"/"` becomes the EMPTY STRING and the prefix test
is `location.startsWith("" + "/")` — true everywhere. A root link needs `end`,
which is almost always what you meant anyway. `aria-current` is unaffected; it
was already exact.

**Trailing slashes are deliberately ignored** on both sides, so `/route` and
`/route/` share active state. Do not add your own normalisation on top.

**The classList keys are toggled, not assigned.** A key that is undefined or
the literal string `"undefined"` is skipped, and a key containing spaces is
split — so passing a composed multi-class string as `class` works, which is not
obvious from the shape of the API.

## Used in

`src/components/navigation/nav-link/nav-link.tsx`, which passes scoped classes
and sets no `aria-current` of its own; and
`src/components/navigation/breadcrumb/breadcrumb.tsx`, which uses plain anchors
for the reason in §3. Both are pinned in `navigation.test.tsx`, including the
root-link case and the "exactly one current claim" case.

## Related

- [[the-current-page-is-an-exact-claim]]
- [[containment-is-not-naming]]
- [[a-check-that-cannot-fail-is-not-a-check]]
