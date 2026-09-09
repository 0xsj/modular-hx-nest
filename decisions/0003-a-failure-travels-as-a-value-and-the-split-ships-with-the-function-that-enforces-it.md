# 0003 — a failure travels as a value, and the split ships with the function that enforces it

**Status:** Accepted   ·   **Date:** 2026-09-09

## Context

`src/lib/kernel/failure.ts` landed with a specification that deliberately left
two things out, each with a stated reason:

- **`Result`** — *"whether the transport returns a failure as a value or throws
  is a separate decision with its own consequences, and it is not this module's
  to make."*
- **`narrow()`** — *"narrowing is something a SERVICE does and there are no
  services, so it would be a modelled state with no caller."*

`lib/http` is the next tier, and writing it makes both of those unpayable
debts rather than deferrals.

**`Result` is forced by the port's signature.** A transport whose `get` returns
`Promise<T>` has decided to throw; one that returns `Promise<Result<T, Failure>>`
has decided not to. There is no third option and no way to write the port
without answering. Deferring it further means writing `lib/http`'s
specification against a return type that does not exist.

**`narrow()` is forced by a rule this repo already wrote down.** The
specification states that only domain kinds may be narrowed away, and it states
what must happen to an unpromised one. That is a rule with no way to obey it.
The first service would write its own fold — and a fold invented per service is
exactly the drift the split exists to prevent.

This record exists because `protocols/decisions.md` names this situation
explicitly: *you are about to reverse something you already argued yourself out
of.*

## Decision

**A failure crosses the transport as a value.** The port returns
`Promise<Result<T, Failure>>`. Nothing in `lib/http`, `lib/services` or
`lib/root` throws.

**`Result` is a class; `Failure` stays plain data.** The asymmetry is the whole
of the design and it follows from where each one travels:

```
  Failure   crosses a serialisation boundary constantly   ->  must be data
  Result    never crosses one — it is unwrapped at the
            tier that produced it                          ->  may have methods
```

`Failure` has no prototype to lose, which is what `F9`'s round-trip property
protects. `Result` is unwrapped before anything is serialised, so it can afford
`map` / `andThen` / `match` and read as a chain rather than as nested calls.

**Exactly one place throws, and it is the framework edge.** A rendering
framework signals failure by a rejected promise — that is what an error
boundary and an async resource are built to catch — so a single conversion
exists at that seam and nowhere else. Below it, control flow stays visible in
the types.

**`narrow()` ships now.** It takes the domain kinds an operation promises and
returns a mapper: transport kinds pass through untouched, a promised domain
kind passes through, and an unpromised one folds to `internal` with the
original as its `cause`.

**The correction to the earlier reasoning, stated so it is not lost:** a
modelled *state* with no caller is a guess about a shape somebody will need.
A *function that makes an already-specified rule executable* is not a guess —
the shape is pinned by the rule, and the only thing deferring it buys is a
period in which the rule cannot be followed. Those are different things and
`CLAUDE.md`'s warning applies to the first.

## Alternatives

**The port throws, and failures are exceptions.** Declined. A failing HTTP call
is routine, not exceptional, so it belongs in the type. Three costs follow from
throwing and the third is the one that decided it: every service needs a
try/catch wrapper; a caller cannot see from a signature what can go wrong; and
the memory adapter would have to *throw* its refusals rather than return them,
which makes a fixture route a control-flow exercise instead of a function that
answers.

**`Result` as a plain discriminated union — `{ok: true, value} | {ok: false,
error}` — with free functions instead of methods.** This is the alternative
that nearly won, and it is better on exactly one axis: it is serialisable, so
the rule below would not be needed. It loses on reading order. `andThen(map(r,
f), g)` inverts the sequence of operations relative to the order they happen,
and every added step nests further; `r.map(f).andThen(g)` reads in the order it
runs. Given that a `Result` is unwrapped at the tier that made it and is not
supposed to cross a boundary anyway, the serialisability it would buy is
insurance against a rule being broken rather than a capability anything uses.

**Keep deferring `narrow()` until a service exists.** Declined on the argument
in §Decision. Recorded as an alternative rather than dropped, because it was
this repo's own position two days ago and the reasoning that overturned it is
narrow — it applies to a helper whose shape a specification has already fixed,
and not to tiers in general.

**Adopt `Result` but not the framework-edge throw.** Declined: something has to
convert a value into the rejected promise a framework's error boundary reads,
and refusing to name where that happens means every screen invents it.

## Consequences

**A `Result` must not cross a serialisation boundary, and nothing enforces
that.** It is a class; sent through a server function it degrades to a plain
object and its methods are gone. The mitigation is a `toJSON` that makes the
degradation legible rather than empty, plus a rule held by review. That is a
real hole and this record is where it is admitted rather than in a comment
somebody finds later.

**Every service is now shaped by `Result`.** Reversing this later is not a
kernel edit, it is a rewrite of every service and every caller. That is the
cost of settling the tier before the callers exist, and it is the reason this
is a decision record rather than a commit message.

**`narrow()` ships with no caller**, which is the thing `CLAUDE.md` warns
about. The defence is in §Decision and it may turn out to be wrong: if the
first service wants a shape this does not fit, that is the signal, and the
correct response is to change it then rather than to have deferred it now.

**`flover-solid ADR 0001`'s barriered run no longer covers this module.** Run
0001 scored a suite derived from the pre-convergence specification, so its
subject hash stops matching the moment the kernel changes — which is the
designed signal, not a failure. A second barriered run over the amended
specification is owed, and until it exists the kernel's coverage claim is
historical.

## Verification

**Owed, not done.** The verification for this record is barriered run 0002 over
the amended specification, reported as a mutation ratio rather than a test
count. Until that runs, the converged kernel is unverified and this record
should be read as a decision that has been made rather than one that has been
checked.

**Not verifiable here:** nothing detects a `Result` crossing a serialisation
boundary. That would be an enforcement rule over the framework's own boundary
markers, and neither the runner nor those markers exist yet.
`protocols/enforcement.md`: *a discipline that is not a failing check is a
preference.*

Cite this record as `flover-solid ADR 0003`.
