# Leak surface — run 0003

Sanitisation was SUBTRACTIVE ONLY.

## Removed

Two oracle banners, procedure meta about the barrier rather than
specification. Nothing else.

## KEPT deliberately, and why — the judgement call in this run

Both specifications contain paragraphs beginning "Measured". They were kept.

`protocols/spec-tests.md` §2 warns about a document that carries **the results
of a previous measurement on the package under test** — it hands the writer an
answer it should have found for itself. That is not what these are.

These measure the RUNTIME, not the implementation:

  - which error name a hand-rolled abort produces versus `AbortSignal.timeout`
  - that `instanceof DOMException` is true for both, so it cannot discriminate
  - that the project's simulated DOM collapses both to one name

None of them says anything about how `envelope.ts` or the adapters are
written. All of them are facts a specification has to state in order to justify
its own clauses — E14 and A5 are unmotivated without them.

The third is load bearing in the other direction: withholding it would cause a
writer to test A5 against an environment where the distinction does not exist,
and the test would PASS while measuring nothing. Removing it would not make the
barrier stronger; it would make the suite worse.

## Known, NOT removed

`02-public-api.d.ts` prints `export declare const UNSERVED_ROUTE =
"unserved_route"` — the literal VALUE, not merely the name. An earlier draft of
this file claimed the value was not visible; that was wrong, and it is
corrected here rather than left for a reader to find.

TypeScript emits the literal for a `const` of literal type, so this is not
removable without misrepresenting the surface. Clause A18 requires an unserved
route to carry a `type` identifying it and deliberately does not pin the
string — but a writer can read the string here, so A18's kill should be
discounted to "the mechanism was tested", not "the marker was independently
derived".

`CORRELATION_HEADER` and `REQUEST_ID_HEADER` print their values for the same
reason. That is necessary rather than leaked: E9 and E10 speak of "the
request-id header" without naming it, and a test cannot construct a `Response`
carrying a header whose name it does not know.
