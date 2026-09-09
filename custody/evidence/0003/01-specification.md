# Module A — the failure-to-value seam

`optional` and `Presence` — the mechanism for the three states.



# 1 · The rule this exists to make obeyable

`CLAUDE.md`: *nobody looked* and *looked and found nothing* are different
facts, and a UI rendering both as an em-dash has thrown away the difference
at the moment it had it.

That rule has been stated since the project began and nothing implemented
it. A rule with no mechanism is a rule the first caller re-invents — and the
re-invention here is one line, `value ? render(value) : "–"`, which loses
the distinction silently and looks like ordinary defensive code.


# 2 · Whether a 404 means ABSENT is a fact about the backend

This is the whole design and everything else follows from it.

    the resource is not there      absence. A real answer
    there is no such path          a defect — a typo, an unbuilt route,
                                   a fixture nobody wrote

Both arrive as `not_found`. Which one a given 404 is depends on how the
backend behaves, and the kernel cannot know that. So the kernel does not
decide: **the caller passes a predicate saying which `not_found` means
absent**, and it is required rather than defaulted.

A default would have to pick one, and the only usable default — *treat every
404 as absence* — is the dangerous reading. Under it a typo in an endpoint
path renders as *looked and found nothing*, which is a screen confidently
reporting a measurement nobody took.

## An unrecognised `not_found` is not emptiness, and not passed through

If the predicate says no, the failure is neither absence nor something the
caller's type promised. It folds to `internal`, carrying the original as
`cause` — the same fold `narrow` performs for an unpromised domain kind, and
for the same reason: the signature stays true and nothing is lost.

Passing it through would be worse than either. The returned type says
`not_found` can no longer occur, so a caller's exhaustive switch has no
branch for it.


# 3 · Two types, because the question is asked twice

    optional     at the SERVICE boundary — turns a failure into a value
    Presence     at the RENDER boundary — names all three so a component
                 cannot write a two-armed conditional and lose one

    Result<T, E>
       -> Result<T | null, Exclude<E, not_found> | internal>
       -> Presence<T, E>  =  found · empty · unmeasured

`null` is the absence marker. `undefined` is not, and a service returning it
is returning a value it has not thought about.


# 4 · CONTRACT

## optional

  O1  Accepts a `Result` or a `Promise` of one, and always returns a
      `Promise`. A caller need not know which it has.

  O2  An `Ok` passes through carrying the same value, by identity.

  O3  A failure whose kind is NOT `not_found` passes through unchanged — by
      identity, not a copy. `optional` decides one kind and touches nothing
      else.

  O4  A `not_found` for which the predicate returns true becomes `Ok(null)`.

  O5  A `not_found` for which the predicate returns false becomes `Err` of
      `internal`, carrying the original as `cause`.

  O6  That fold PRESERVES `message`, `type`, `requestId`, `correlationId`
      and `status` from the original. It is the same fold as the narrowing
      one, and a divergence between the two is a defect in whichever moved.

  O7  The predicate is called with the `not_found` failure itself, and is
      called ONLY for `not_found` — never for an `Ok`, never for any other
      kind.

## The two supplied predicates

  O8  `anyNotFound` returns true for every `not_found`. It is the weak
      choice and exists to be greppable: adopting it says *this backend
      cannot distinguish nothing-here from no-such-path*, and accepts that a
      mistyped endpoint will render as absence.

  O9  `absentWhenType(t)` returns true exactly when the failure's `type` is
      `t`, and false when `type` is absent.

## Presence

  O10 `presenceOf` maps an `Err` to `unmeasured` carrying the failure, an
      `Ok(null)` to `empty`, and any other `Ok` to `found` carrying the
      value.

  O11 `empty` and `unmeasured` are never the same state. This is the clause
      the whole module exists for: a component that cannot tell them apart
      has thrown the distinction away at the moment it had it.

  O12 The three states are exhaustive and mutually exclusive — every
      `Result<T | null, E>` maps to exactly one.

  O13 `Ok(undefined)` is `found`, not `empty`. `null` is the absence marker
      and `undefined` is a value nobody thought about.


# 5 · Mechanics

**The returned error type both removes and adds.** `not_found` is excluded
because it can no longer occur; `internal` is added because O5 can produce
one. A signature that only removed would be lying in the other direction.

**The predicate is a function, not a list of types.** A backend that marks
absence by a status, a header, or the shape of a message is served by the
same seam, and a list would have to grow a case for each.


# 6 · Deliberately absent

**A default predicate.** See §2. The friction is the feature: a caller that
has not decided which 404 means absence has not finished designing the read.

**A `Presence` for a collection.** An empty list is not the same question —
a read that returned zero rows LOOKED. Whether a component wants a fourth
state for *not applicable* is a real question and no caller has asked it.

**Rendering.** `Presence` is a type, not a component. What an `unmeasured`
looks like is a design decision and belongs where the design is.


# 7 · What this specification does NOT decide

  - What any predicate should be for a particular backend.
  - Whether a service should call `optional` itself or leave it to a screen.
  - The `message` of the folded `internal` beyond O6's preservation.
  - What `Presence` looks like rendered.


---

# Module B — the throw boundary

The one place a failure becomes a throw.



# 1 · Why anything throws at all

Nothing below the framework edge throws. A failure is a value, the transport
returns a `Result`, and control flow stays visible in the types — that is
the whole of `ADR 0003`.

The edge is where that stops being possible. A rendering framework signals
failure by a REJECTED PROMISE: that is what an error boundary catches and
what an async resource propagates. Neither reads a `Result`. So somewhere a
value has to become a rejection, and the only question is whether that
happens in one place or in every screen.

This module is the one place. `unwrap` is the sanctioned conversion and
there is no other.


# 2 · The return journey is the harder half

Throwing is easy. Catching is where the design is, because **what arrives in
a catch is `unknown`** and it may have travelled.

An `AppError` that crossed a serialisation boundary is no longer an
`AppError` — the prototype is gone and `instanceof` answers false — but the
`failure` field survives, because a failure is plain data. That is the
asymmetry the whole model was built for, arriving at the one place that has
to cope with it.

So `asFailure` is a ladder of narrowing guesses, ordered from most to least
certain, and it is TOTAL: every input becomes a failure, and it never
throws. An error path that can itself fail replaces one diagnosis with a
worse one.

    an AppError                     -> the failure it carries
    something structurally a Failure -> itself. This is a failure that
                                       crossed a boundary as DATA
    something with a .failure field  -> that. This is an AppError that
                                       crossed and lost its prototype
    an Error                         -> internal, keeping its message and
                                       its name as `type`
    anything at all                  -> internal, with a constant message

**The order is observable and it is part of the contract.** An `AppError`
IS an `Error`; if the `Error` rung came first, every thrown failure would be
flattened to `internal` and its kind lost — the exact information the model
exists to carry.


# 3 · CONTRACT

## AppError

  X1  `AppError` is an `Error`: `instanceof Error` is true, and it has a
      stack.

  X2  Its `message` is the failure's `message`, so a log line that prints
      only the error still says something.

  X3  Its `name` is `"AppError"`.

  X4  It carries the failure as `.failure`, BY IDENTITY — not a copy.

## unwrap

  X5  `unwrap(ok)` returns the value by identity, and does not throw.

  X6  `unwrap(err)` throws an `AppError` whose `.failure` is that error by
      identity.

## asFailure

  X7  TOTAL. It returns a `Failure` for every input and never throws — for
      `null`, `undefined`, a string, a number, a symbol, an array, a plain
      object, and a circular object.

  X8  Given an `AppError`, it returns the carried failure by identity.

  X9  Given something structurally a `Failure`, it returns that value by
      identity. This is how a failure that crossed a boundary as data is
      recovered.

  X10 Given an object whose `failure` field is structurally a `Failure`, it
      returns that field. This is how an `AppError` that crossed a boundary
      and lost its prototype is recovered.

  X11 Given an `Error` that is none of the above, it returns `internal` with
      the error's `message`, and the error's `name` as `type`.

  X12 Given anything else, it returns `internal` with a fixed message.

  X13 THE ORDER OF THE RUNGS IS OBSERVABLE. An `AppError` must be recognised
      as an `AppError` and not as an `Error` — the first would preserve its
      kind and the second would flatten it to `internal`.

  X14 An `Error` whose `message` is empty still produces a failure with a
      non-empty `message`. A nameless failure is worse than a generic one.


# 4 · Mechanics

**`AppError` extends `Error` rather than wrapping one.** A framework's error
boundary, a logger and a debugger all expect an `Error` — a plain object
thrown instead arrives with no stack, and the one thing anybody wants at
that point is where it came from.

**`asFailure` uses `instanceof` for `AppError` and a STRUCTURAL check for a
`Failure`.** Deliberately mixed. `instanceof` is correct for the local case
and useless for the travelled one, and the structural rung exists precisely
because `instanceof` cannot answer it.


# 5 · Deliberately absent

**Any framework import.** This module is the edge's SHAPE, not its wiring.
What catches the rejection is the framework's business and lives in a tier
that may import one.

**A `try`-wrapping helper.** A function that runs a callback and converts a
throw is one line at the call site and a policy everywhere else.

**Logging.** `asFailure` classifies. Where a failure is reported is a
product's decision.


# 6 · What this specification does NOT decide

  - Where `unwrap` is called. Only that it is the sole conversion.
  - The exact text of X12's fixed message.
  - Whether `AppError` should carry a `cause` in the platform sense.
  - What an error boundary renders.


---

# Module C — the decoder

The decoder — the only file permitted to name a wire key, a header or a
status code.



# 1 · What it is for

A server sends bytes. Something has to turn ANY response into exactly one
`Failure`, and everything above this file sees only that failure — no
`Response`, no status number, no header name, no `res.json()`.

Two properties make that safe against a server nobody here controls:

**It is TOTAL.** Every response becomes exactly one failure. It never throws
— not on a body that is not JSON, not on an empty body, not on a body some
other code already consumed. An error path that can itself fail replaces one
diagnosis with a worse one.

**It never widens the union.** A `kind` this client does not recognise is
preserved as data rather than admitted as a new member. The client is never
WRONG at runtime, only less specific.


# 2 · The body classifies; the status is the fallback

When the body declares a kind we recognise, that wins. The server has
already decided how a caller should react, and recovering a kind from the
status when the body states one is the same work done twice, drifting.

`kindFromStatus` exists for bodies that are not ours: a proxy's 502, an HTML
error page, a framework's default 404 for a route nobody built.

**An unrecognised kind falls back to the STATUS, not to `internal`.** This is
the one worth arguing. A server sending `{"kind":"seat_limit_reached"}` with
409 is telling us two things, and only one of them is unfamiliar. Folding to
`internal` discards the 409 and renders "something went wrong" for a
conflict the client could have handled; classifying by status keeps the
behaviour and puts the unfamiliar word in `type`, where a product that wants
it can read it. Nothing is lost either way, and one way is more useful.

## The status map is to BEHAVIOUR, not to HTTP

It is not a lookup table of RFC meanings. Two statuses that call for the
same client behaviour map to the same kind, which is why there are ten kinds
and not thirteen.

    400 422 428  -> invalid          the request must change before retrying
    409 412      -> conflict         the state moved under us
    401          -> unauthenticated
    403          -> forbidden
    404          -> not_found
    429          -> rate_limited
    499          -> canceled
    503          -> unavailable
    504          -> timeout
    anything else-> internal


# 3 · Transport failures have no response at all

DNS, a dropped socket, an abort. There is no status to read, so the only
signal is the thrown value.

**Matched by `name`.** Measured on 2026-09-09: under this runtime a
hand-rolled `controller.abort()` throws `AbortError`, `AbortSignal.timeout`
throws `TimeoutError`, and `AbortSignal.any([timeout, callerSignal])`
preserves `TimeoutError` when the timeout is what fired.

`instanceof DOMException` is TRUE for all three, which is why it is not the
discriminator: it is not unreliable, it is insufficient — every one of them
is a `DOMException`, and only the name says which.

**The distinction is load-bearing.** A timeout classified as a cancellation
would never be retried, because a cancellation is something the caller
asked for. That is the reason a timeout must come from `AbortSignal.timeout`
rather than from a controller aborted by hand.

**The honest limit, and it is measured too.** What name arrives is the
environment's decision, not this function's. Under the simulated DOM this
project tests in, BOTH routes report `NetworkError` — so driving a real
`fetch` there cannot verify this mapping. The contract below is therefore
about the MAPPING from a name to a kind, and it is written so it can be
checked by handing the function a shaped value rather than by making a
request.


# 4 · CONTRACT

## Totality

  E1  `failureFromResponse` returns a `Failure` for every response and never
      throws. Including: a body that is not JSON, an empty body, a body that
      has already been consumed, and a body that is valid JSON but not an
      object.

  E2  `status` on the returned failure is always the response's status.

## Classification

  E3  A body declaring a kind in `FAILURE_KINDS` produces that kind,
      whatever the status says.

  E4  A body declaring a kind NOT in `FAILURE_KINDS` produces the kind the
      STATUS maps to, and preserves the declared value in `type`.

  E5  A body with no `kind` produces the kind the status maps to.

  E6  The status map is exactly the table in §2, and any status absent from
      it produces `internal`.

  E7  A body's own `type` wins over a preserved unrecognised kind. They
      occupy the same field and the explicit one is the server's intent.

## Metadata

  E8  `message` is the first present of: body `message`, body `detail`, body
      `title`, the response's `statusText`, and finally a non-empty constant.
      An empty string at any level is treated as absent.

  E9  `requestId` is the body's `request_id`, else the request-id header,
      else absent.

  E10 `correlationId` is the body's `correlation_id`, else the correlation
      header, else absent. Absent here does NOT mean the failure has no
      correlation — an adapter attaches what it sent.

## Per-kind payloads

  E11 An `invalid` failure always carries `fields`. It is built only from
      string-valued entries of the body's `fields`; a `fields` that is
      missing, null, an array or a scalar yields `{}`.

  E12 A `rate_limited` failure takes `retryAfter` from the body's
      `retry_after`, else the `Retry-After` header, else it is absent. A
      value that is not a finite number is absent, and zero is a value.

  E13 No kind other than `invalid` carries `fields`, and none other than
      `rate_limited` carries `retryAfter`.

## Transport

  E14 `failureFromTransport` maps by `name`: `AbortError` to `canceled`,
      `TimeoutError` to `timeout`, and anything else to `unavailable`.

  E15 It never throws, for any input — including `null`, `undefined`, a
      string, a number, and an object with no `name`.

  E16 Its result carries no `status`. There was no response.


# 5 · Deliberately absent

**A second decoder for a different backend.** `ClientConfig.decodeFailure`
replaces this one wholesale. A product adopting the template does not edit
this tier; it passes its own function.

**Retry scheduling.** `retryAfter` is carried as the wire stated it. What to
do with it is policy and belongs where retries happen.

**Any use of the response body on a 2xx.** This file decodes failures. A
successful body is the adapter's business, and a body that will not parse on
a 200 is a contract break rather than a transport problem — folding it in
here would label it `unavailable`, which is retryable, and the client would
hammer an endpoint answering perfectly well with the wrong shape.


# 6 · What this specification does NOT decide

  - The unit of `retryAfter`. It is carried as the wire states it.
  - What any adapter does with the failure once decoded.
  - Whether a 2xx with an unreadable body is this tier's problem. §5 says it
    is not this FILE's; naming the kind belongs to the adapter's spec.
  - The casing of header names as they arrive. `Headers` is case-insensitive
    by specification and this file relies on that rather than restating it.


---

# Module D — the two adapters

The two adapters — one port, two implementations, and the property that a
caller cannot tell which one answered.


One document for both, because the claim worth the most here is a claim
about the PAIR. Specified separately, "indistinguishable from above" has
nowhere to live and becomes a sentence nobody can check.


# 1 · What an adapter owes

It satisfies `HttpClient` and it never throws. Every exit is a `Result` —
a refusal, a dropped socket, a cancellation, a body that will not parse, a
route nobody registered. `flover-solid ADR 0003` decided that; here it
becomes a property two implementations have to hold identically.


# 2 · The timeout must not be hand-rolled

Measured under this runtime on 2026-09-09:

    controller.abort()                        -> AbortError
    AbortSignal.timeout(ms)                   -> TimeoutError
    AbortSignal.any([timeout, callerSignal])  -> TimeoutError, when the
                                                 timeout is what fired

A timeout built from a controller aborted by hand is therefore
indistinguishable from the caller's own cancellation — and a cancellation is
never retried, because the caller asked for it. A hand-rolled timeout would
make every timeout permanently non-retryable, silently, with a correct-looking
`canceled` on the screen.

The caller's signal is COMBINED with the timeout, never replaced. A caller
that passes a signal has not given up its right to a timeout, and a client
that dropped the timeout on that branch would hang forever on the one
request somebody was already watching.


# 3 · A body that will not parse on a 2xx is OUR problem

It is decoded outside the transport `catch`, deliberately. Folded in, a
contract break would be classified `unavailable` — which is retryable — so
the client would hammer an endpoint that is answering perfectly well with
the wrong shape. It is `internal`: nobody's network failed, the agreement
did.


# 4 · An unserved fixture route is not a 404

**This departs from `protocols/fixtures.md` §3, which says falling off the
end of the route list is a 404 "exactly as it would be". The departure is
deliberate and the reason is recorded here rather than left as a silent
disagreement.**

That rule conflates two different facts:

    the SERVER does not serve this path      a 404 is the truth, and a
                                             fixture reproduces it by
                                             registering a route that
                                             returns one

    the FIXTURE was never written for a      the fixture is incomplete.
    path the server does serve               Calling that a 404 invents a
                                             server answer nobody gave

The protocol's own principle decides it. *A fixture more helpful than the
server is the wrong kind of wrong* has a mirror: a fixture that INVENTS a
server answer is wrong in the same way, and this is the invention that hurts
most — `failure.doc.ts` §3 shows it ending as a screen reporting *looked and
found nothing* about an endpoint nobody ever built.

Two thirds of the protocol's clause survive and are kept: falling off the end
is **not a crash** and **not an empty success**. It is a loud, distinct
failure that names itself as the fixture's rather than the server's. A screen
that wants to exercise a 404 registers a route that returns one — which it
had to do anyway to choose the message.


# 5 · CONTRACT

## Both adapters

  A1  Both satisfy `HttpClient`: `request`, and `get`/`post`/`put`/`patch`/
      `delete` delegating to it with the matching method.

  A2  Neither ever throws or rejects. Every outcome is a resolved `Result` —
      including a malformed body, a transport error, a cancellation, and a
      path no route matches.

## The fetch adapter

  A3  The request URL is `baseUrl` with trailing slashes removed, then the
      path APPENDED. A mount path in `baseUrl` survives — resolving the path
      against the base instead would discard it.

  A4  `params` entries whose value is `undefined` are omitted. Every other
      value is stringified.

  A5  The timeout is `AbortSignal.timeout`, and the caller's signal is
      combined with it rather than replacing it. `options.timeoutMs` wins
      over `config.timeoutMs`, which wins over the default.

  A6  `content-type: application/json` is sent when, and only when, a body
      is being sent.

  A7  An `authorization` header is sent when, and only when, the configured
      accessor returns a non-empty token.

  A8  The correlation header is sent when, and only when, the configured
      accessor returns a non-empty id.

  A9  Caller-supplied `headers` are applied last and win over the headers
      above. A caller stating a header explicitly has said what it means.

  A10 A non-2xx is passed to `config.decodeFailure` when supplied, and to
      the envelope's decoder otherwise, and returned as `Err`.

  A11 A 204 is `Ok` with an undefined value. No parse is attempted.

  A12 A 2xx whose body will not parse is `Err` of `internal` — never
      `unavailable`. See §3.

  A13 A throw from `fetch` itself becomes `Err` of the transport
      classification for that thrown value.

## The memory adapter

  A14 Latency is non-zero by default and configurable. A zero-latency fake
      makes every pending branch unreachable, and unreachable branches rot.

  A15 Routes are tried in order. The first whose method and pattern both
      match handles the request; the rest are not consulted.

  A16 A route receives the method, path, params, body, the bearer token as
      the client would have sent it, and the correlation id. A fixture that
      cannot see what a caller sent cannot reproduce a server that reads it.

  A17 A caller signal that is already aborted yields `Err` of `canceled`,
      without consulting any route.

  A18 NO ROUTE MATCHING yields `Err` of `internal`, carrying a `type` that
      identifies it as an unserved route. Never `not_found`. See §4.

  A19 A route's own `Result` is returned unchanged, apart from A20.

## The pair

  A20 Correlation is attached identically by both. What the answer already
      carries wins; otherwise the id the client would have sent is attached;
      if there is no id, nothing changes. A successful result is never
      modified.

  A21 INDISTINGUISHABLE FROM ABOVE. For a given refusal, the failure a
      fixture route returns and the failure decoded from the equivalent
      response agree on `kind`, on `message`, and on the presence of the
      per-kind payload. A caller branching on `kind` cannot tell which
      adapter answered.

      This is the clause the pair exists for, and the only one that cannot
      be checked by testing either adapter alone.


# 6 · Deliberately absent

**Retries.** Nothing here retries. `isRetryable` classifies; scheduling is
policy and belongs where a retry would actually be issued.

**A response cache.** That is the async-state tier's job, not the
transport's.

**A decoder seam on the memory adapter.** It never decodes a `Response` —
its routes return failures directly, so there is nothing for a decoder to
do. The asymmetry is the shape of the problem rather than an oversight.

**Route registration helpers.** What a fixture route looks like beyond its
signature is the fixture set's business, and there are no fixtures.


# 7 · Testing this tier needs the runtime's own fetch

Not a note about tooling — a consequence of §2, and it decides whether A5 is
checkable at all.

Measured 2026-09-09: under the simulated DOM this project tests in, BOTH a
hand-rolled abort and an `AbortSignal.timeout` report `NetworkError`. The
distinction A5 exists to protect does not survive that environment, so a
test written there passes whether the timeout is hand-rolled or not.

A stubbed `fetch` does not rescue it either: a stub resolves before any
timeout can fire, so nothing exercises the branch.

A test for A5 therefore has to run against the RUNTIME's fetch, with a
server that accepts and never answers — `// @vitest-environment node` at the
top of the file. Everything else in this contract is checkable with a stub.

Recorded here rather than in a test file because it is a property of the
contract's verifiability: a clause whose only honest test needs a different
environment is a clause that will otherwise be tested wrongly and pass.


# 8 · What this specification does NOT decide

  - The default timeout and the default latency, beyond A5 and A14.
  - The `type` string A18 uses, only that one identifies the case.
  - What a route does with the token; A16 only requires that it can see it.
  - Whether a fixture session and a real session may be mixed. That is
    `lib/root`'s question.
  - Anything about a 2xx body's SHAPE. The adapter parses; validating is a
    service's business.


---
