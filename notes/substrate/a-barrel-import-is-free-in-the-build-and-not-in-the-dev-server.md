# A barrel import is free in the build and not in the dev server

Tree-shaking is a property of the production bundler, so "the barrel
tree-shakes" is true and answers a question nobody asked when the cost being
paid is a dev server resolving every module in the package on every page load.

**True of `lucide-solid` 1.43.0 under Vite 8.1.4 · verified 2026-09-08 —
measured.**

**Origin** — a re-export file that confines an icon library to one module, and
an open question left in a component's spec about which import form it should
use. Both forms were said to tree-shake, which was where the reasoning stopped.

## What was measured

The same page, the same two icons rendered, only the import form in the
re-export file changed:

```
                lucide requests   total requests   load
  subpath              4               939         1,954 ms
  barrel           2,081             3,016         8,124 ms
```

The package ships 2,077 icon modules. The barrel is one module that imports all
of them, so a dev server that serves modules unbundled serves all of them.

Both variants rendered identically — two SVGs, same markup.

## Why the usual answer is not wrong, just irrelevant

`sideEffects: false` plus a statically analysable named re-export means the
production bundler drops every icon nobody imported, from either form. That is
true and it is what people check. It says nothing about a development server,
which does not bundle: it resolves and serves modules on demand, so the graph's
*size* is the cost rather than the output's size.

Two different tools, two different questions, and the answer to one is quoted
as the answer to the other.

## Gotchas

**The subpath modules export `default`, not a name.** So each line renames on
the way through — `export { default as X } from "<pkg>/icons/x"`. That reads
like boilerplate and is the thing that makes the list a declaration of the
surface rather than a re-export of everything.

**Icon file names are kebab-case, component names are Pascal.** `loader-circle`
is `LoaderCircle`. There is no error for getting it wrong — the import just
fails to resolve, which is at least loud.

**A cold start hides it.** The first measurement after a config change includes
dependency optimisation, so compare two warm runs or the numbers say more about
the cache than about the import.

**This inverts for a package with few modules.** The subpath form costs a line
of renaming per icon; below some size the barrel is simply better. The number
that matters is how many modules the barrel reaches, not whether a barrel
exists.

## Used in

`src/components/utility/icon/icon.ts` — two entries, both subpath.

## Related

- [[a-measurement-of-the-wrong-thing-is-confident]]
- [[a-check-that-cannot-fail-is-not-a-check]]
