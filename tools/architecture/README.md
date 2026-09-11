# Architecture check

Read-only evidence for Flover's building rules. The CLI checks source structure;
the [review guide](REVIEW.md) asks an agent to evaluate reuse, error behavior, and
composition using that evidence and the implementation.

## Contract

Initial contract recorded before implementation, 2026-09-10. Scope and limitation
clarifications were added during implementation; this is a living contract, not
sealed evidence for a blind test run.

- `npm run check:architecture` defaults to `--changed`: staged, unstaged, and
  untracked production sources relative to HEAD, plus affected importers followed
  through local re-exports. `--base <ref>` includes changes
  since the merge base with that ref. `--all` checks all production sources.
  The content inspected is the current working tree. Index-only versions are
  not separately inspected; run against the intended checkout for commit evidence.
- The supported source inventory is all of `src/`, including `src/routes/`, `src/examples/`,
  `src/components/` and `src/lib/`, including TS/TSX/JS/JSX/MTS/MJS/CTS/CJS. Tests, declarations, and
  dependency/build directories are excluded from checks. Types may still load
  declarations and dependencies for resolution.
- TypeScript parses imports, exports, dynamic literal imports, and literal
  require calls. It resolves local modules and symbols before applying rules.
  Comments and string examples are not import edges. A type/configuration error
  is missing verification, never a clean architectural result.
- The rulebook declares each rule's statement, detection, message, exemptions,
  and limits. Every mechanical rule must have an implementation. Every exception
  must carry a reason; unused exceptions are visible. Unimplemented mechanical rules,
  malformed rule metadata, invalid arguments/compiler configuration,
  and unreadable sources fail the run. A zero-file inventory fails. A clean Git
  diff is explicitly `no_changes`, not an audit of the whole repository.
- Reports identify the scope, eligible file counts, locations, evidence, and
  statuses: `verified`, `violation`, `needs_review`, and `not_checked`.
  `verified` applies only to the declared detector and inspected scope.
- Review evidence includes nearby imports/callers and a catalog of public
  components. Similar JSX, native controls with existing wrappers, catches, and
  failure fallbacks are leads to inspect, not proof of a defect. Review remains
  pending even when no heuristic found a lead.
- `--json` writes one JSON document to stdout. Normal output is human readable.
  Neither mode edits code, updates a baseline, invokes an agent, runs a build or
  tests, installs packages, or contacts a network.
- Exit 0: selected mechanical checks found no violation (review can be pending).
  Exit 1: a mechanical violation. Exit 2: verification could not complete, such
  as invalid arguments/configuration, Git errors, or type errors.
- Changes to the checker, its rulebook, package/compiler configuration, or
  shared review instructions expand `--changed` to all production sources.
  Deletions are reported, and surviving importers enter the checked scope.

This check is implementation-aware. Its fixture tests do not claim independent
black-box provenance or prove that the rulebook describes the right product.

## Run

```sh
npm run check:architecture -- --changed
npm run check:architecture -- --all
npm run --silent check:architecture -- --base main --json
npm run test:architecture
```

Use npm's `--silent` option when piping JSON; it suppresses npm's lifecycle banner.
No dependencies beyond this repository's installed TypeScript and Node are needed.

Then ask an agent: **“Review these changes using tools/architecture/REVIEW.md.”**
The agent must read the affected code and report its judgments separately from
the executable evidence. No provider or agent CLI is required by this template.

Builds, behavioral tests, browser checks, and blind spec tests remain separate
verification. In particular, source checks cannot establish what a backend
actually returns or what a screen reader announces.

The reasoning behind the split is recorded in
[`notes/modules/architecture-check`](../../notes/modules/architecture-check.md).
