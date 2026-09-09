# Writer's prediction — run 0002

Preserved VERBATIM from the writer's report, which was produced before any run.
Run 0001's entry could not make this claim because the report was not kept.

## Predicted failures

> None with confidence — I have not seen the implementation, and every test
> here is derived from an explicit or directly-inferable-and-flagged spec
> clause. If I had to name where I'd bet on friction, in order of likelihood:
>
> - The **F8 "omits unsupplied metadata" table** and the **F6/F7
>   key-exclusivity tests** are the ones most likely to catch a real bug, since
>   "store `undefined` instead of omitting the key" is an extremely easy and
>   common implementation mistake that a naive `{ ...meta }` spread does *not*
>   actually cause, but a constructor built with named-default-parameters often
>   does.
> - The **F21/F22 identity checks in `narrow`** (`toBe`, not `toEqual`) are a
>   plausible failure point if the implementation reconstructs a new object for
>   the pass-through case instead of returning the original reference — the spec
>   is explicit ("identity, not a copy") but this is an easy detail to lose.
> - The **`because` no-mutation check** (F12) is a plausible failure point if
>   the implementation does `Object.assign(f, {cause})` instead of
>   `{...f, cause}`.

## Outcome

All three named areas PASSED. No test the writer wrote failed on the first run.

Its reasoning about where bugs live was sound — F8, F21 and F12 are exactly the
three the implementation had to work to get right, and all three were later
killed by deliberate mutation. It was right about the risk and wrong about this
code, which is the distinction a prediction is for.

## Ambiguities the writer reported, verbatim summary

Six, each handled by omission or by an in-file marker rather than a guess:
F14's chain contents on a cycle (tested termination only, not contents);
`isDomain` having no prose formula (mirrored test, flagged as an inference);
F4's "reproduce exactly" being ambiguous between set- and order-equality
(sidestepped); whether combinators preserve by identity or by value (read as
identity, flagged); R7's "never throws" being untestable as a universal (spot
check only, stated as such); and whether the `Err` WRAPPER instance is
preserved by a pass-through (tested error identity only, the stronger claim
not being stated).
