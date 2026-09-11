# Resilience mutation checks

`bun run test:resilience:mutations` makes a temporary source copy, verifies a green baseline, and runs 17 curated behavioral faults. The original working tree is never changed. It checks each mutant with Svelte before counting assertion failures, and tests both an equivalent control and a deliberate type-error control. A compiler error is invalid evidence, not a killed mutant. The printed evidence path contains source/test hashes, compiler output, assertion results and the report.

These are implementation-visible regression tests inherited/adapted from the Next template. They are not an independently authored blind oracle or a claim that all possible faults are detected. See the optional `protocols/spec-tests.md` for the separate blind workflow.
