# A Solid component under Vitest renders to nothing by default

Two of the runner's defaults each break a component test in a way that blames
the component: the SSR export condition makes every query find nothing, and
stubbed CSS Modules make every class list read `undefined`.

**True of `vitest` 5.0.0, `@solidjs/testing-library` 0.8.10 and `happy-dom`
20.14.0 · verified 2026-09-08 — measured.**

**Origin** — the first run of a Button suite, where the failure looked like a
component that renders nothing rather than a runner pointed at the wrong build.

## The two settings

```ts
resolve.conditions: ["development", "browser"]
test.css: true
```

**Without `browser`**, Solid resolves to the build that renders to a string.
Nothing touches the DOM, every query finds nothing, and the report reads as a
broken component.

**Without `css: true`**, CSS Modules are stubbed and the import returns an empty
object — so `s.button` is `undefined`, every class list comes out
`"undefined undefined"`, and a totality assertion over variants fails for a
reason unrelated to the code it is testing.

Both are the same failure shape: a runner misconfiguration that presents as a
defect in the subject.

## Gotchas

**`--reporter=basic` was removed in 5.0.0, and it throws while loading a custom
reporter module BEFORE any test executes.** A scoring harness that classifies on
the exit code alone reads that as every test failing — so every mutation scores
as *killed* and the ratio comes back perfect from a run that executed nothing.
This was hit within an hour of adopting the major. Require positive evidence
that the suite ran — a parsed `Tests N passed` line — and classify its absence
as INVALID, never as a kill.

**A separate config is needed**, because a framework meta-plugin in the app's
Vite config brings a router and an SSR pipeline that fight the test transform.
The cost is that the path alias then exists in two files and can drift.

**`css: true` is not free.** It processes stylesheets rather than stubbing them,
and the cost scales with modules imported, not with tests written.

## Used in

`vitest.config.ts`; `src/components/forms/button/button.test.tsx`.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]] — the general form, and the two other ways it happens
