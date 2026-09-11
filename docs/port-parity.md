# Solid behavior parity

Contract recorded before port implementation, 2026-09-10. This is an implementation-visible port from flover-next and the completed flover-svelte port. Tests imported or authored during the port are regression evidence, not a fresh blind oracle. Original Solid custody, decisions and protocols remain intact.

- Match all 22 kitchen-sink categories and their interaction/state coverage.
- Match public gradient landing, cookbook/manual, authentication return addresses, fresh /app, standard/rail/auth shells and fifteen cookbook recipes.
- Retain local Result/Failure, injected services, scoped roots, explicit decoding, cancellation, storage and read/write recovery semantics.
- Use native Solid ownership, signals, derived values and lifecycle bindings; SolidStart server boundaries expose plain data. No sibling runtime imports.
- Use blue accents in both themes, with distinct warning/error semantics.
- Verify portable contracts, type checking, production build, structural architecture checks, mutations and real browser behavior. Record scope and gaps honestly.

## Status

Implemented and verified in the staging checkout, 2026-09-11 (Europe/Istanbul).

- Production build and TypeScript pass; ESLint reports zero errors and warnings.
- 47 unit-test files pass: 1,185 passing tests and two inherited skips. The fresh-build fixture-exclusion check passes.
- All nine production Chromium suites pass: routes, controls, cards, components, items, foundations, workspaces, expansions and resilience. The final catalog suites also pass in development mode.
- All eight mechanical architecture detectors ran across 537 production sources without a violation. Semantic review remains separate.
- 17/17 curated mutations were killed. The equivalent and invalid-code controls were classified correctly; recorded test/module hashes match the final source.
- Desktop and mobile captures were visually inspected in addition to the automated checks.

Machine-readable evidence: [summary](verification/solid-port/summary.json), [browser suites](verification/solid-port/browser.json), [mutations](verification/solid-port/mutations.json).

## Native Solid decisions

- Components use signals, accessors, memos and owner cleanup. Browser-model subscriptions can rebind when a source changes; account-specific roots are constructed under keyed account owners.
- Ark UI remains behind owned components. Stateful examples use `defaultValue`/`defaultChecked` when uncontrolled. Native text inputs retain Solid's `value` semantics.
- Repeated JSX slots are resolved once per owner. Canvas nodes and dashboard widgets provide lazy content callbacks so geometry inspection does not construct unused JSX during SSR.
- Browser queries defer their data-resource read until mount, as well as disabling the fetch before mount. This preserves the server shell through hydration without losing query error/cancellation policy.
- Native form reset runs after the browser default action. Reset also recreates a date field's segmented editing owner so an incomplete draft cannot outlive the reset.
- Presence-based data attributes use explicit marker strings. Package imports use component/icon subpaths so development previews do not load entire vendor barrels.

## Review scope and limits

This is an implementation-visible port. Imported tests retain their existing provenance; tests written during this port are regressions. The mutation score describes seventeen curated faults, with an equivalent-code control and a compile-error control. It is not evidence that every possible incorrect implementation would be caught.

The architecture CLI checks all production sources and leaves semantic judgments pending. Representative review traced reuse through cards, selection controls, field composition, chart data tables and workspace slots; error behavior through the server session boundary, decoded service responses, durable item writes and live-query recovery; and ownership through keyed account roots and subscription cleanup. Native controls inside wrappers and locally readable catalog examples are intentional. This is not a claim that every source file received a line-by-line semantic audit.

Seven superseded scaffold API test files are preserved under `docs/verification/scaffold-contracts/` as source records. They are not counted as passing tests. Two inherited HTTP spec-test skips remain: timer-budget enforcement and the old token-extraction shape. Browser checks cover Chromium, sampled contrast, responsive bounds, keyboard/focus and automated accessibility checks; they do not certify assistive-technology behavior or every browser.

Backend-independent ports and envelope mapping are implemented. The examples exercise fixtures and simulations; production authorization, durable operation receipts, job execution and real socket delivery remain backend responsibilities. No real backend integration or production deployment is claimed.
