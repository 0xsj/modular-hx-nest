# SolidStart routes a file only if it has a default export

The underscore in `_components/` is a convention with no power behind it; what
actually keeps a helper out of the router is the absence of a default export —
which means adding one publishes a page at a URL nobody chose.

**True of `@solidjs/start` 2.0.0 · verified 2026-09-08 — read the source, then
confirmed with a request.**

**Origin** — wanting to colocate a showcase page's sections and helpers inside
its own route directory. Some file-routers have an explicit private-folder
convention; this one does not, so the question was what actually decides.

## What the source says

`dist/config/fs-router.js`, `toRoute(src)`:

```js
const hasDefault = exportNames.includes("default");
if (hasDefault) {
  return { page: true, /* … */ path };
}
// falls through — returns undefined, so no route is registered
```

Two filters run, and they are independent: an extension glob decides which files
are *looked at*, and the default-export check decides which of those become
routes. A `.ts` file with named exports only passes the first and fails the
second.

Confirmed against a running server:

```
  GET /kitchen-sink                   200
  GET /kitchen-sink/_sections/tokens  404
```

## Gotchas

**It is fragile by construction.** A helper that later grows a default export
becomes a page, at a path derived from its location, with no error and no
warning. The safeguard is a comment at the top of every such file saying the
missing default is load-bearing — which is a comment, not a check.

**This is about routing, not bundling.** The file is still compiled and still in
the module graph. Nothing here makes it private.

**The convention is still worth keeping.** An underscore tells a reader; the
missing default tells the router. Dropping the underscore because it does
nothing loses the half that a person reads.

## Used in

`src/routes/kitchen-sink/_components/`, `_lib/` and `_sections/` — every file
there exports by name only. `src/routes/kitchen-sink/index.tsx` is the one file
in the directory with a default export.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]]
