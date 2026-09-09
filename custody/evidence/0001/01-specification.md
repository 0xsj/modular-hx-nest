The failure model — the vocabulary every tier above `http` branches on.



# 1 · A failure is a value

Not an exception, and not a class.

It crosses boundaries constantly — a server render to a client, a cache to a
component, a log line, a test fixture. A class does not survive that: JSON
strips the prototype and `instanceof` starts answering `false` for an object
that is otherwise intact. Anything that must be recognisable on the far side
of a serialisation has to be recognisable STRUCTURALLY, which means plain
data and a discriminant.

So: a discriminated union of plain objects, `kind` as the discriminant, and
per-kind payloads on their own variants. That last part is what makes
"`retryAfter` belongs to a rate limit and nowhere else" a type error to get
wrong rather than a convention nobody enforces.


# 2 · A kind is a client BEHAVIOUR, not a server condition

The union is small because it is not trying to describe a backend. It
describes what a caller should DO. Two server conditions that lead to the
same screen are one kind; a backend that grows a new condition does not grow
this union.

A product's own vocabulary rides in `type` — `"seat_limit_reached"` — and
never as an extra kind. That is the extension point, and having one is what
lets the union stay CLOSED: an unrecognised `kind` from a server is preserved
in `type` and normalised to a known member, never admitted as a new one.

The consequence worth stating: the client is never WRONG at runtime, only
less specific. Adding a kind later is then a deliberate act that lights up
every exhaustive switch, rather than something a server can do to us.


# 3 · The split, and the test that draws it

A service wants a narrow signature — *I return T, or not-found* — so that a
screen is not handed kinds the operation cannot produce.

Narrowing is where this goes wrong. Suppose `getUser` declares its only
failure is `not_found`, and the server rate-limits. Two options and both are
bad: fold it, and the screen says **"user not found" for a rate limit** —
a wrong answer, not a lost detail; or pass it through, and the signature is
a lie every caller's exhaustive switch has a hole for.

The fix is not to forbid narrowing. It is to notice that the kinds are not
all the same sort of thing:

    A kind is DOMAIN if and only if the author of the operation has the
    knowledge to rule it out.

That is a question about who knows what, which is exactly what narrowing
requires. Applied:

    TRANSPORT — no operation author can rule these out
      unauthenticated   a token expires mid-session
      forbidden         the author does not know the caller's grants, and
                        grants change between two calls
      rate_limited      not the operation's to control
      unavailable       not the operation's to control
      timeout           not the operation's to control
      canceled          the CALLER decides, not the operation
      internal          the unknown bucket; must always be possible

    DOMAIN — the author genuinely knows
      not_found         a create cannot 404 the thing it is creating
      invalid           an operation that takes no input cannot be invalid
      conflict          a read cannot conflict with anything

`forbidden` is the one worth arguing about and it is the clearest case for
the test. It FEELS like a domain concern — *you may not see this workspace*
is about the resource. But a service claiming it cannot produce `forbidden`
is claiming something about the caller's permissions, which it cannot know.
Transport.

**Only domain kinds may be narrowed away.** A transport kind passes through
every signature untouched, which is what keeps a rate limit's retry-after
alive and stops a cancellation being rewritten as an error.

## `not_found` carries two facts, and one of them is a bug

    the resource is not there        a domain answer, meaningful
    there is no such route           a deployment or client defect

This template makes the second sharper than usual, because it ships a memory
adapter: **an unregistered fixture route is exactly that case.** If it
decodes to `not_found`, a screen reports *looked and found nothing* about an
endpoint nobody ever built — which is the precise lie
`protocols/fixtures.md` says the adapter exists to prevent.

So an unserved fixture route must not be `not_found`. That rule belongs to
`lib/http`, and is recorded here because this is where the ambiguity lives.


# 4 · Shape

    kind        the discriminant
    message     DIAGNOSTIC FIRST — the server's words or ours. It goes in a
                log. User-facing copy comes from an exhaustive switch, in the
                product's own voice, and never from here
    type?       the extension point. A backend condition, or a preserved
                unrecognised kind
    requestId?  the SERVER's id for the one call that failed. Read, never minted
    status?     carried for diagnostics, and NEVER branched on above `lib/http`
    cause?      what this failed WHILE doing

    invalid       + fields: Record<string, string>
    rate_limited  + retryAfter?: number   (seconds, as the wire states it)

`message` being diagnostic rather than user-facing is the field most often
got wrong. A server's message is written for whoever reads the logs; putting
it on a screen ships someone else's voice, in someone else's language, about
an internal noun.


# 5 · CONTRACT

Numbered so a failure can cite one. Each is a claim about observable
behaviour, not about how the module is written.

## The sets

  F1  `TRANSPORT_KINDS` and `DOMAIN_KINDS` are DISJOINT, and `FAILURE_KINDS`
      is exactly their union with no duplicates.

  F1a MEMBERSHIP IS PINNED. `TRANSPORT_KINDS` is exactly the seven named in
      §3 and `DOMAIN_KINDS` exactly the three, by name.

  F2  Every member of `FAILURE_KINDS` is classified by exactly one of
      `isTransportKind` / `isDomainKind` — never both, never neither.
      Totality over a closed set.

  F3  `isFailureKind` returns false for every string outside `FAILURE_KINDS`,
      and for every non-string. This is what "closed at runtime" means.

## Constructors

  F4  Each constructor returns a failure whose `kind` is its own, and no
      other. Constructing every kind and reading back `kind` must reproduce
      `FAILURE_KINDS` exactly.

  F5  Each constructor sets `message` to the string it was given, unchanged.

  F6  `invalid` always carries a `fields` object — possibly empty, never
      absent — and no other variant carries one.

  F7  `rate_limited` is the only variant that may carry `retryAfter`.

  F8  A constructor never invents metadata. A field not supplied is absent
      from the result rather than present and undefined, so that a failure
      that crossed JSON is equal to one that did not.

## Recognition

  F9  `isFailure` is STRUCTURAL. Round-trip property: for every constructed
      failure `f`, `isFailure(JSON.parse(JSON.stringify(f)))` is true.
      This is the property the whole no-class decision exists for.

  F10 `isFailure` is false for `null`, `undefined`, a string, a number, an
      array, an object with no `kind`, an object whose `kind` is not a known
      kind, and an object with a known `kind` but a non-string `message`.

  F11 `isTransport(f)` is true if and only if `f.kind` is in
      `TRANSPORT_KINDS`. It agrees with `isTransportKind(f.kind)` for every
      constructible failure.

## Cause chain

  F12 `because(f, c)` returns a failure equal to `f` in every field except
      `cause`, which is `c`. It does not mutate `f`.

  F13 `chain(f)` returns the causes outermost-first, beginning with `f`
      itself.

  F14 `chain` TERMINATES on a cycle. A failure that is its own cause, or two
      that cause each other, must not hang or overflow.

  F15 `rootCause(f)` is the last element of `chain(f)`, and is `f` itself
      when there is no cause.

## Retry classification

  F16 Exactly `rate_limited`, `unavailable` and `timeout` are retryable.

  F17 `canceled` is NOT retryable. The caller asked for it; retrying is
      doing the thing they cancelled.

  F18 No domain kind is retryable. A 4xx is an ANSWER — asking again and
      hoping for a different reply turns one wall into three.

## Exhaustiveness

  F19 `assertNever` throws when reached. It exists so that adding a kind is
      a compile error at every switch rather than a silent fallthrough, and
      a runtime throw is the backstop for a value that arrived untyped.


# 6 · Mechanics

**`as const` arrays, not a TypeScript `enum`.** The arrays are the runtime
value and the types are derived from them, so the two cannot disagree. An
enum gives a type and a separate object that must be kept in step, and its
numeric form does not survive a wire at all.

**Guards are structural, never `instanceof`.** See F9. This is also why
there is no base class and no `Error` subclass anywhere in this module.

**`fields` is `Record<string, string>` and not a richer shape.** A field
error is a sentence for a person next to an input. A structured code per
field is a second vocabulary to keep in step with a backend, for a gain
nothing here has asked for.


# 7 · Deliberately absent

**`narrow()`** — the helper a service uses to declare which domain kinds an
operation produces. Narrowing is something a SERVICE does and there are no
services, so it would be a modelled state with no caller — which `CLAUDE.md`
says is a tier that will be wrong when something finally reaches it. The
rule it enforces is specified in §3 and the helper arrives with the first
service to shape it.

**`Result`** — whether the transport returns a failure as a value or throws
is a separate decision with its own consequences, and it is not this
module's to make. This module says what a failure IS; how it travels is
`lib/http`'s question.

**`retryDelay`** — how long to wait is POLICY, and classification is not.
`isRetryable` says whether trying again is meaningful; a backoff curve
belongs where retries actually happen, and nothing retries yet.

**A user-facing message table.** `message` is diagnostic. Copy is a
product's voice and belongs in the exhaustive switch that renders it.


# 8 · What this specification does NOT decide

Stated so a test writer reports these rather than guessing.

  - The `message` text of any constructed failure beyond F5's pass-through.
  - Whether `status` is present. It is optional and only `lib/http` sets it.
  - The unit of `retryAfter` beyond "as the wire states it" — the decoder
    owns that conversion and does not exist yet.
  - Whether two failures with identical fields should compare equal by any
    means other than structural equality.
  - What an unserved fixture route decodes to. §3 says what it must NOT be;
    naming what it IS belongs to `lib/http`.
