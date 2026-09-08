# Fixtures

> **A fixture reproduces the server's behaviour including its refusals — not its
> happy path.**
> Use when the client can run with no backend, when a screen must be built before
> its endpoint exists, or when a fixture has started being called a stub. Ends in
> a memory adapter a screen genuinely cannot distinguish from the server.

**Adopt this when** the transport is behind a port with more than one
implementation. **It costs you** the discipline of transcribing refusals you
would rather not reproduce, and one extra element in most fixture collections.
**Decline it** if the client only ever runs against a live backend — but then
delete the memory adapter too, rather than keeping one that lies.

---

## Memory mode is a supported way to run the application, not a stub

The value is not testing. It is that **a screen can be built, reviewed and
demoed before its endpoint exists**, and that the difference between *the backend
is down* and *this screen is broken* stays legible.

That only holds while the two adapters are indistinguishable from above. The
moment a fixture is easier to satisfy than the server, every screen built against
it is built against a contract nobody serves — and the bill arrives on the day
the domain graduates, screen by screen, with no single change to blame.

**A stub makes unreachable branches look tested.** That is worse than having no
fixtures, because the pending and error paths still exist, still render, and have
never once been exercised.

---

## The port is the contract

Four properties make the seam symmetric. Losing any one of them turns the
adapter into a stub.

**1 · Same errors, same shape.** A fixture refuses by throwing the same error
value the real adapter produces from a real problem document — same kind, same
status, same message. A caller branching on `kind` must not be able to tell which
adapter answered.

**2 · Non-zero latency by default.** A zero-latency fake makes every `pending`
branch unreachable, and unreachable branches rot. Simulate a round trip; make it
configurable, never zero by default.

**3 · Falling off the end is a 404**, exactly as it would be. A route returning
"not mine" lets the next one try; no route matching is a genuine not-found, not a
crash and not an empty success.

**4 · The bearer arrives the same way.** A fixture route reads a token off the
request rather than being told who is asking. Without it a fixture cannot tell
one caller from another, and every route has to answer for a single imaginary
tenant.

---

## Transcribe; do not invent

Where a real response exists, **read it and reproduce it**. Where nothing has
ever been served, invent — and mark which is which, so the next person knows what
they are holding.

**The order of checks is part of the behaviour.** If the server validates the
address before the password, a request wrong in both ways is refused for the
address. A fixture that checks them the other way round is indistinguishable
until somebody submits both wrong, and then the screen shows the wrong error.

**Reproduce the refusals you would rather not.** If the decoder rejects unknown
fields, the fixture rejects them. If the server attaches no per-field errors, the
fixture attaches none — even though per-field errors would make the form nicer.

> **A fixture more helpful than the server is the wrong kind of wrong.** The
> screens come out built around a shape the endpoint has never heard of, and it
> looks like good work until it ships.

---

## `SERVED` is a list, not a boolean

A backend arrives one endpoint at a time. A single "do we have a server" flag
means the **first** real endpoint breaks every screen that depends on the ones
still unbuilt — because at that point there is no fallback, by design.

```
  hasServer: boolean          the first real endpoint breaks eleven screens
  SERVED: Domain[]            a name moves into the list the day it is served
```

Per-domain, graduating a domain is one line in one place. Print it at startup so
the answer to *"is this screen real?"* needs no investigation.

**Two questions, not one.** *Is this domain served* is about the backend's
progress. *Is this session real* is about who is asking. A fixture session must
be fixtures the whole way down: reading a persona's data from the live server
would 404, and reading real data while signed in as a persona would be a
disclosure. One prefix on the token is enough to carry the distinction.

**Surface it in the interface.** A screen rendering fixture data says so. The
badge costs nothing and it is the difference between a demo that is honest and
one that is not.

---

## Designing the data

### A fixture that agrees by position tests nothing

A rule like *"pick the one whose name matches X"* is indistinguishable from
*"pick the first one"* — and **fixtures are written in the order the rule
describes**, so the discriminating case never gets written by accident.

```
  origin   a mutation replacing a designated lookup with list[0] survived
           all eleven tests in a file. Every one listed the target first,
           because that is how you write a fixture for a rule about it
```

It is a family, not a bug. The pattern is *selection by property, tested against
a collection ordered by that property*:

```
  "the live one"        the fixture has one row, and it is live
  "the newest"          the fixture is written newest-first
  "the default"         the default is listed first
  "the matching one"    the matching one is the only one
  "the highest"         the values are already sorted
```

Two fixes, both cheap:

- **Put the target somewhere awkward** — third of three, with a decoy first that
  would produce a *different, plausible* answer. A decoy producing the same
  answer tests nothing either.
- **Assert the value, not the shape.** A length check passes under the mutant; an
  identity check does not.

The habit: **for every "pick the one that…" rule, mutate it to "pick the first"
and confirm something fails.** If nothing does, the discriminating fixture is
missing and it is one line.

### Fixed seeds, never random

A random fixture makes a screenshot unreproducible and a bug report
unanswerable. Fixed ids, fixed timestamps. Where a screen must mutate and be
demoed again, ship a `reset` rather than randomising.

### Cover the states, not just the rows

The interesting branches are the ones no happy path reaches. A fixture set with
only populated success cases leaves `empty`, `error`, `stale` and `partial`
rendered but never seen.

```
  empty          a real zero, distinct from "not loaded"
  refusal        each error kind the screen branches on
  boundary       one row, and enough rows to page
  slow           reachable pending
```

---

## How this rots, and what catches it

| Rot | Looks like | Caught by |
| --- | --- | --- |
| a fixture drifts from a changed endpoint | screens work locally, fail deployed | contract test against the real server |
| a fixture is loosened to unblock a screen | the screen ships | review — the diff is in the fixture, not the screen |
| a domain is served but not moved into `SERVED` | fixture data in production | the startup line, read |
| latency set to zero "for the tests" | pending states never render | grep, and the state checklist above |

**The first row is the only one needing infrastructure**, and it is worth it the
day a fixture and an endpoint disagree in a way nobody notices for a week.

---

## Checklist

```
  [ ] the fixture refuses with the same error values the real adapter produces
  [ ] latency is non-zero by default
  [ ] no route matching yields a 404, not a crash or an empty success
  [ ] refusals are transcribed from real responses where any exist
  [ ] the ORDER of validation matches the server's
  [ ] nothing is more permissive or more helpful than the endpoint
  [ ] invented behaviour is marked as invented
  [ ] SERVED is per-domain, and printed at startup
  [ ] a fixture session is fixtures for every domain
  [ ] the screen shows when it is rendering fixture data
  [ ] every "pick the one that…" rule has a decoy fixture, not first in the list
  [ ] ids and timestamps are fixed
  [ ] empty, refusal, boundary and slow are all reachable
```
