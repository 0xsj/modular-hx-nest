# Review Flover architecture

Use this guide for an implementation-aware, read-only review. The CLI supplies
structural evidence; the reviewer supplies judgments grounded in the affected
contracts and callers. Do not edit code as part of this review.

## Establish scope and evidence

1. Read the repository instructions, [rulebook](rules.mjs), and
   [checker contract](README.md). Use the installed runtime from `.nvmrc`.
2. Run `npm run --silent check:architecture -- --changed --json`. For a branch
   review use `--base <target-ref>`; for a baseline review use `--all`.
   Record the command, current revision, working-tree state, and reported scope.
   Do not turn an empty diff into a whole-repository verdict.
3. Resolve any `incomplete` result before relying on the mechanical checks.
   A violation is evidence to assess against its named rule and exemption.
   A `verified` rule means its declared detector ran in that scope; it does not
   establish overall correctness. A disabled rule remains `not_checked`.
4. Read the actual diff, affected sources, their contracts (`doc.ts` where
   present), and representative callers. Use `scope.context` as a starting
   point, following barrels and dependencies as necessary. Consult the public
   component catalog before suggesting a new abstraction. Read related CSS and
   tokens; for `--all`, include `styles/` and component styles explicitly.

The catalog contains callable PascalCase exports from group barrels, so verify
each candidate's contract. It is a discovery aid, not a complete semantic index.
The leads are also incomplete: review each applicable lens even if no lead fired.

## C1 — Reuse and duplicated knowledge

For new markup or logic, find existing primitives, patterns, kernel utilities,
and service operations that could own the same responsibility. Compare behavior,
accessibility, states, and styling contracts—not just component names.

Recommend reuse when the existing contract fits. Recommend extraction when
multiple callers repeat a decision that must change together, and show those
callers. Similar JSX with different reasons to change can stay separate. Native
controls inside wrappers and independently readable kitchen-sink examples can
be appropriate. Explain an intentional exception rather than treating every
duplicate as debt. Do not introduce configurable abstractions without a caller.

## E2 — Error meaning, scope, and recovery

Trace a changed operation from port/service Result through its binding to the
rendered state and recovery action. Inspect unsuccessful branches, not only
the happy path or `catch` leads.

- Preserve `Failure` kinds and field errors where the caller needs them. Check
  that backend envelopes are translated at the transport boundary and vendor
  details do not become UI contracts.
- Evaluate the scope: a failure that makes the screen meaningless reaches its
  error boundary; a failed region retains the surrounding usable screen.
- Check `unwrap`, `asFailure`, `match`, and fallbacks in context. A fallback that
  converts failure or an unmeasured value into successful empty data loses meaning.
  A catch used for best-effort local persistence may have a sound fallback.
- At server/client boundaries, inspect plain state conversion, retained form
  values, and exposed messages. The Result detector covers server returns;
  also inspect props passed into client components and any type-erased data.
- Recovery must fit the failure: retry, edit invalid fields, authenticate,
  or explain a refusal. Inspect pending state, duplicate writes, and whether
  success/error feedback is visible to the user.

Use real caller consequences in findings. A throw, catch, or `unwrapOr` alone
does not establish incorrect handling. Backend behavior requires its own evidence.

## C2 — Composition and ownership

Check that primitives own interaction and semantics, patterns compose coherent
slots/parts, and pages supply application data and decisions. Inspect where
state lives and whether props expose a usable contract or leak an adapter.
Look for duplicate state, domain-specific branching in reusable components,
and application imports hidden behind public barrels.

Test a proposed abstraction against actual callers. File length, prop count,
and component count are clues, not rules. Preserve straightforward local
composition when a new layer would merely forward every prop.

## T1 — Design system and observable behavior

Review tokens and cascade layers alongside the rendered component. Check
keyboard access, accessible names, focus, disabled/read-only behavior, and
pending/empty/failed/unmeasured states as applicable. Compare the kitchen-sink
examples with the component's declared states; a happy-path example is not
complete coverage.

Use browser verification when a claim depends on layout, hydration, navigation,
or focus. Record what was exercised and what remains untested. Source inspection
cannot establish contrast, responsive usability, or assistive-technology output.

## Report

Keep these separate:

- **Mechanical evidence:** scope, commands, eligible counts, violations,
  exemptions, incomplete/disabled checks. Preserve the CLI's statuses.
- **Review findings:** rule ID, file and line, concrete evidence, consequence,
  confidence, and a focused recommendation. For reuse, name the existing
  component and explain the contract match. Distinguish bugs from suggestions.
- **Judgments without findings:** say “reviewed; no finding in the inspected
  scope,” naming the contracts/callers inspected and intentional exceptions.
- **Open work:** unreviewed files, uncertain paths, absent backend evidence,
  and tests/browser checks not performed. Do not give a quality score or mark
  a semantic rule automatically verified because tests or the CLI are green.

Run additional verification only when relevant to the claims. Bundle claims
require a fresh `npm run build` before the bundle test; an existing build can be
stale. A missing build must be reported as skipped. Architecture fixture tests
exercise the detector and are implementation-aware negative controls. They are
not blind spec tests or a mutation score. Keep any separately established blind
test workspace and its information barrier intact.
