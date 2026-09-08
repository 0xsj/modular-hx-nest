# Custody

> **A request-side record of what an actor was asked to do, what it was permitted
> to do, and what came back — kept by the party doing the trusting, not the party
> being trusted.**
> Use only when a suite's provenance will be *claimed* to somebody who was not
> watching. Ends in a hash chain and a re-runnable score.

> ### Optional, and more optional than the rest of this set
>
> Nothing else here depends on it. [`spec-tests.md`](spec-tests.md) produces a
> better suite with or without custody; the barrier does the work and this only
> **records** that the barrier held.
>
> **Adopt it when** you will make a provenance claim to a third party, or when
> the same argument keeps being had about whether a suite is genuinely
> independent. **It costs you** a file per run and the discipline of copying
> perishable material before it ages out. **Decline it** for a solo project where
> nobody is being asked to trust anything — and that is the common case. A
> custody directory nobody reads is bookkeeping.

---

## The distinction it exists for

An actor's own report of its run is a **receipt**: it is issued by the thing
whose behaviour is in question. A receipt can be sincere and still wrong.

```
  origin   in one recorded run the writer confidently predicted seven of its
           own tests would fail. All seven passed. Nothing was concealed —
           a receipt is an account of somebody's reasoning, which is not
           evidence about the world
```

Custody holds the other side: hashes of every input and output, the runtime's own
record of what was done, and a check that does not depend on anyone's honesty.

**The name is the question it answers: what is the chain of custody on this?**
Who handled this artifact, under what constraints, and can it still be trusted by
someone who was not watching. **The constraint half is the important half** — a
capability grant is exactly a custody control.

---

## What it can prove

**Capability, not intention.** The strongest claim is not *"the actor did not
read your source"* — it is *"the actor could not."* When the grant is write-only,
the absence of a read capability is a structural fact recorded in a file, and the
claim follows from the grant rather than from a promise. See
[`spec-tests.role.md`](spec-tests.role.md) Part I.

**Actions, because the runtime records them and the actor cannot edit them.** A
transcript written by the runtime carries every call with its arguments. That is
genuine provenance for what was *done*.

**Integrity over time.** Each entry hashes its own body and carries the previous
entry's hash. Editing entry 3 invalidates the chain from 3 onward. A suite
quietly rewritten later stops matching the hash its entry claims, so the
provenance claim **visibly ceases to cover what is in the tree** rather than
silently continuing to imply it.

**Reproducibility, which needs no trust at all.** The mutation ratio is
re-runnable by anyone with the repository. It does not prove how the tests were
written; it proves the property actually at stake — **that they are not vacuous.**

---

## What it cannot prove, stated plainly

**It cannot prove what a model knew.** A capability grant bounds what it could
*access*, never what it already carried. For private code that distinction is
academic; for a well-known open-source package it is not, and no custody record
fixes it. **Capability is observable, cognition is not.**

**It is tamper-evident, not tamper-proof.** The store is a directory the author
controls. It defends against accidents and casual edits, not against a determined
author rewriting both the artifact and its record.

**The quality line is the known stretch.** A custody record traditionally
concerns handling, not grade. The mutation ratio is a judgement about the
artifact rather than a fact about who held it, and it sits here anyway because it
is the one line that needs no trust.

---

## Shape

```
  manifest.json     every artifact, by sha256, in an append-only chain
  verify.sh         recompute all of it and report drift
  NNNN-*.md         one entry per run, in prose
  evidence/NNNN/    the perishable material, copied before it ages out
```

An entry records:

```
  grant       the capability list the actor was given, verbatim
  oracle      every input by hash — and whether anything leaked
  actions     the runtime's record, not the actor's account
  output      the artifact as produced, before any human edit
  score       the mutation ratio, and who chose the mutants
```

**`evidence/` exists because the runtime's record is perishable.** Copy it during
the run. A transcript that has rotated away leaves an entry making a claim with
nothing behind it — which is worse than no entry, because it reads as evidence.

---

## Separation of duties

**Whoever writes the record must not have taken part in the run.** An actor
summarising its own run produces a receipt, which is the thing custody exists to
replace.

Enforce it mechanically rather than by instruction where you can: the entry names
the run, and the check refuses an entry whose author appears in that run's own
transcript. Held only by prose, it holds exactly as long as everyone complies —
which is the standard this protocol is otherwise arguing against.

---

## The score, and how it lies

The mutation ratio is the one number here that needs no trust — **but only if the
harness actually ran.**

A harness that fails to run still produces a number. It arrives on schedule,
looks like every other number, and is wrong. Worse, **the error direction is not
random**: a harness watching for a non-zero exit reads every infrastructure
failure as the outcome it was hoping for.

```
  cause                          exit   read as      truth
  a test genuinely failed         ≠0    killed       correct
  the mutant did not compile      ≠0    killed       INVALID
  the timeout binary is absent    ≠0    killed       nothing ran
```

**A uniform result is the tell.** 52 of 52. 16 of 16. 100%. A real suite against
real code rarely produces one; a broken harness produces one reliably, because
nothing varies when nothing executes.

**Record who chose the mutants.** A mutation score is bounded by the imagination
of whoever wrote the mutation list, and a ratio reported without that caveat is
read as a property of the suite rather than of the pair.

---

## Checklist

```
  [ ] this run makes a claim somebody who was not watching needs to check
      — if not, stop here; do not keep a custody directory out of habit
  [ ] the grant is recorded verbatim, not summarised
  [ ] every oracle input hashed, and leak surface stated
  [ ] the runtime's own record copied into evidence/ before it rotated
  [ ] the entry's author took no part in the run
  [ ] the chain links to the previous entry
  [ ] a negative control confirms the harness ran
  [ ] the mutation ratio names who chose the mutants
  [ ] the entry says what it cannot prove
```
