# protocols

Procedures, as documents. **No runtime is assumed and none is required** — a
person can follow any of these by reading it.

This directory ships inside the project. It is a **choice, not a framework**:
adopt none, some, or all, and delete what you do not want. Nothing in the
application imports anything here.

---

## The set

**Verification** — checking that what was built is what was meant.

| | | Adopt when |
| --- | --- | --- |
| [`spec-tests`](spec-tests.md) | tests written from a specification behind an information barrier, scored by mutation | a module has a doc or contract worth pinning |
| [`spec-tests.role`](spec-tests.role.md) | the writer's role — what it is told, and what it must be **unable** to do | you are binding the above to any runtime |
| [`render-verification`](render-verification.md) | read the render with a program, not with an opinion | a screen carries small text, a theme, a form, or post-hydration state |
| [`accessibility`](accessibility.md) | the floor, and two shapes that make the worst defects unrepresentable | the project ships interactive components at all |
| [`enforcement`](enforcement.md) | conventions as detection specs — import boundaries, tiers, seams | more than one person or session edits the tree |
| [`fixtures`](fixtures.md) | the memory adapter reproduces the server's refusals, not its happy path | the transport is behind a port with more than one implementation |

**Record** — keeping what was learned and what was decided.

| | | Adopt when |
| --- | --- | --- |
| [`notes`](notes.md) | write only what the code cannot say | you intend to still be here in six months |
| [`decisions`](decisions.md) | record what will otherwise be re-litigated, and seal it | choices are being made that get questioned later |
| [`custody`](custody.md) | the request-side record of an agent run | **rarely** — see its own header |

**Start with `notes` and `enforcement`.** One is impossible to backfill honestly;
the other only holds if the seams exist from the first module. The rest can be
adopted at any point.

---

## Three rules that keep this a choice

**1 · Nothing imports a protocol.** Delete this directory and the project still
builds, boots and tests. The moment a protocol becomes load-bearing it has
stopped being optional — and a set that reads as mandatory gets adopted or
discarded whole, discarded being the usual outcome.

**2 · Each document states its own cost.** Every adoptable protocol opens with
*adopt this when · it costs you · decline it for*. If you cannot say what a
protocol costs, you are not in a position to recommend it.
(`spec-tests.role` is the exception — it is a companion to `spec-tests`, not
separately adoptable.)

**3 · Off carries a reason.** A protocol declined because it does not apply here
should say so. One declined because it is inconvenient is a preference wearing a
config key. **Silence is not an answer** — the same rule
[`enforcement`](enforcement.md) applies to a disabled check.

---

## The one thing that is free today and expensive tomorrow

**Write the contract before the code.** [`spec-tests`](spec-tests.md) ranks
oracles, and the strongest is one written before the implementation existed —
because it *cannot* have been derived from it. The same property makes an
`Alternatives` section real in [`decisions`](decisions.md): written after, it is a
justification, and a justification never has one.

Everything else here can be adopted late. This cannot be recovered.

---

## Format

```markdown
# Title

> **The job, in one sentence.**
> Use when … Ends in <what it produces>.

**Adopt this when** … **It costs you** … **Decline it** for …
```

No frontmatter. No slash-command syntax — a cross-reference is a relative link,
so it resolves in any reader, including `cat`. A protocol names what it **cannot**
detect as well as what it can, because a document listing only its catches is
read as a guarantee.

---

## Provenance

These are extracted from things that actually happened in a working project, not
composed as best practice. The measured numbers in them are real — the contrast
ladder that survived two visual reviews at 2.81:1, the layer rule that produced
489 findings against correct code, the 1,086-to-111 split between disposable and
transferable notes.

That is also the standard for adding one: **a protocol earns its place by
recording a failure, not by describing a virtue.**

---

## Relationship to the wider corpus

A larger set — product interrogation, and these engineering protocols — lives
outside any single project. This directory holds the subset that travels **with**
a project, so a clone is complete: every protocol here runs against this
repository alone, with nothing else present.

That is the test for adding one. If it needs a sibling project, a shared
authority, or a file the user cannot edit, it does not ship here.
