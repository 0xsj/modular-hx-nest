# 0002 — the runner is Vitest in a simulated DOM, and a claim that needs the cascade is not covered by the suite

**Status:** Accepted   ·   **Date:** 2026-09-08

## Context

[[0001-spec-tests-start-at-lib-http-and-a-component-doc-is-a-note-rather-than-a-sealed-oracle]]
decided *which* method applies where and left *what runs it* open, because no
runner existed. Its stated unmitigated cost was that `Button`'s sixteen
contract clauses had no check at all: they had been verified once by a
throwaway browser probe that was never committed.

Closing that needs a runner, and the choice is not only a runner. Three things
are decided together and only the first is obvious:

- what executes the tests;
- what they render into — a simulated DOM or a real browser;
- and therefore **which clauses are checkable at all**, because `B14` is partly
  a computed-style claim (`pointer-events: none`, from a CSS Module) and a
  simulated DOM performs no cascade and no layout.

This record is written after the runner was installed and the suite was made to
pass, which is stated rather than hidden. That ordering is acceptable here and
would not be for a contract: nothing below is an `Alternatives` section
reconstructed to justify a choice — the browser tier was priced before
`happy-dom` was installed, and the cost it buys is recorded in Consequences
rather than argued away.

## Decision

**Vitest is the runner**, at `5.0.0`, configured in a `vitest.config.ts` of its
own rather than as a `test` key on `vite.config.ts`.

**Tests render into `happy-dom`**, a simulated DOM. `@solidjs/testing-library`
does the rendering. No assertion library beyond Vitest's own `expect`.

**Test files are colocated** as `<name>.test.tsx` beside the component.

Four settings are load-bearing and each is commented at its site, because three
of them fail in a way that names the wrong culprit:

- **`resolve.conditions: ["development", "browser"]`.** Solid ships an SSR build
  and a browser build behind export conditions. Without this the test imports
  the SSR build, which renders to a string and never touches the DOM — so every
  query finds nothing and the failure reads as a broken component rather than a
  misconfigured runner.
- **`test.css: true`.** CSS Modules are off by default and the default returns
  an empty object, so `s.button` is `undefined` and every class list is
  `"undefined undefined"`. `B3` would fail for a reason that has nothing to do
  with the component.
- **`environment: "happy-dom"`**, and
- **the separate config**, because `solidStart()` brings a router, a server
  build and an SSR pipeline that a unit test has no use for.

**A scoring harness is required before any suite is believed.** A first-run
pass is equally consistent with a good suite and a vacuous one, so a suite is
reported only alongside deliberate mutations and a control that must fail. The
harness restores from content read at mutation time, in a `finally`, one file
only — and it must classify a run that did not execute as **INVALID**, never as
a kill.

## Alternatives

**`node:test` with a DOM shim.** Declined on wiring. Solid's JSX needs a
compiler, and the tree's `~/` alias, CSS Modules and TypeScript all come free
from the Vite pipeline. Under `node:test` each becomes a separate mechanism to
configure and keep in step with the one the application already uses — and a
test that resolves modules differently from the app is a test of a different
program.

**Jest.** Declined for the same reason and one more: it needs its own transform
for Solid's JSX, so the compiler under test would not be the compiler that
ships. Vitest reuses the Vite pipeline, which is the property being bought.

**A real browser from the start — `@vitest/browser` with Playwright.**
Declined, and it is the alternative that actually lost something. It verifies
the whole cascade, so `B14` would be covered end to end, and it is the same
instrument the throwaway probe used. Against it: a browser download in every
environment that runs the suite, a slower run on every save, and — measured on
2026-09-08 — its Solid binding `vitest-browser-solid` was last published
`1.0.1` on 2025-10-31, roughly ten months stale against a `@vitest/browser`
that shipped `5.0.0` five days earlier. Adopting a stale adapter to reach a
tier nothing needs yet is a dependency taken on for a hypothetical.

**`jsdom` instead of `happy-dom`.** Declined on weight rather than principle.
`jsdom` is the more spec-complete of the two and is the correct answer the day
a test needs something `happy-dom` does not implement. That day is the trigger
to switch, and switching is one line.

**A `test` key on `vite.config.ts`.** Declined because `solidStart()` is in that
plugin list and the test transform fights it. The cost of the separate file is
recorded below.

**Commit the mutation harness as infrastructure.** Declined for now. It is a
probe: it ran by hand, answered a question once, and lives in a scratch
directory. `protocols/render-verification.md` — *a probe is what you write when
you need an answer once; a suite is what you write when you need the answer
again.* It becomes infrastructure when `lib/http` needs a reported ratio, which
is what [[0001-spec-tests-start-at-lib-http-and-a-component-doc-is-a-note-rather-than-a-sealed-oracle]]
sends there.

## Consequences

**Any claim that needs layout or the cascade is not covered, and one already is
not.** `B14` says an inert polymorphic control gets `pointer-events: none` from
`[data-disabled]`. The attribute half is asserted; the computed-style half is
not, and cannot be under this runner. It was confirmed once with a browser
probe that no longer runs. This is the direct cost of the decision.

The same limit applies in advance to anything the design system will want next:
a focus ring is a contrast ratio against a surface, `:focus` does not match in a
headless environment without focus emulation, and an overlay's focus
restoration only exists in a hydrated page. None of those is reachable here.
`protocols/render-verification.md` is the instrument for all of them, and it is
a different job.

**The `~` alias now exists in two files.** `vite.config.ts` gets it from
`tsconfig.json`; `vitest.config.ts` declares it. Two declarations of one fact
drift. It is one line today and the trigger to extract it is a second line.

**`css: true` makes the run slower**, because stylesheets are processed rather
than stubbed. Measured at 1.3s for 35 tests, so this is a note rather than a
problem — but it scales with the number of modules imported, not with the
number of tests.

**The component anatomy gains a sixth file.** `CLAUDE.md`'s Layout block lists
five per component and `button.test.tsx` is not among them.

**Vitest 5.0.0 was three days old when it was adopted** — published 2026-09-05,
pinned here on 2026-09-08. A major release that recent has not had its
migration hazards found by anybody else yet, and one was hit within the hour:
`--reporter=basic` was removed, and it throws while loading a custom reporter
module *before any test executes*. A harness watching only the exit code would
have read every mutation as killed. That is why the INVALID classification in
the Decision is normative rather than advice.

## Verification

**Verified, and this is the part that needs no trust.**

`pnpm test` runs 35 tests over `Button`. Six deliberate mutations were applied
to `button.tsx` — one per contract clause with a caller that should die — and
**all six were killed**, with an unmutated baseline and an unmutated restored
run at either end as controls. `git diff` was empty afterwards, confirming the
`finally` restore covered only the mutated file and only the content read at
mutation time.

```
  baseline                            SURVIVED   all passed     <- control
  B2   drop the type default          killed
  B4   drop the caller's class        killed
  B6   inert ignores loading          killed
  B8   flags render as false          killed
  B14  asChild loses tabindex         killed
  B14  asChild loses aria-disabled    killed
  restored                            SURVIVED   all passed     <- control
```

**Who chose the mutants matters and is recorded**: they were written by the same
session that wrote the component and the tests, so the ratio is bounded by that
session's imagination and is a property of the pair rather than of the suite
alone. It is evidence the suite is not vacuous. It is not evidence the suite is
complete.

**Not verified:** nothing enforces that a component with behaviour has a test at
all. That is a rule for the enforcement runner, which does not exist —
`protocols/enforcement.md`: *a discipline that is not a failing check is a
preference.*

Cite this record as `flover-solid ADR 0002`.
