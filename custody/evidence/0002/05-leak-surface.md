# Leak surface — run 0002

Sanitisation was SUBTRACTIVE ONLY. Verified: no line appears in the oracle
that does not appear in one of the two specification files.

## Removed before the oracle was passed

1. **`failure.doc.ts` §F1a amendment narrative — 11 non-blank lines.**
   It described a mutation round already run and named the mutant that had
   survived it. `protocols/spec-tests.md` §2 names this leak class: a document
   carrying the results of a previous measurement hands the writer an answer it
   should have found for itself. The F1a CLAUSE was retained; only the
   narrative went.

2. **`failure.doc.ts` oracle banner — 15 non-blank lines.** Procedure meta
   about the barrier, not specification.

3. **`result.doc.ts` oracle banner — 2 non-blank lines.** Same.

## Known, NOT removed, and reported rather than hidden

**`02-public-api.d.ts` prints the literal membership of `TRANSPORT_KINDS`,
`DOMAIN_KINDS` and `FAILURE_KINDS` as `readonly [...]` tuples.** Clause F1a
pins that membership, so F1a is satisfiable from the type surface without
reading the specification.

This is not removable. The tuples ARE the type; stripping them would
misrepresent the API a writer must compile against. It is recorded here so a
reader can discount F1a's kill accordingly.

Run 0001's API oracle additionally carried 14 clause citations in JSDoc, which
made ten clauses readable from the type surface. That is fixed — this one was
emitted with `--removeComments` and contains zero clause citations and zero
implementation idioms.
