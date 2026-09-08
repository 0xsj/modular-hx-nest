# Decisions

> **A decision that was not recorded will be re-litigated, and the second answer
> will be worse, because the information that produced the first is gone.**
> Use before making a choice that is expensive to reverse — not after. Ends in a
> record with a real alternatives section, a named verification, and a status
> that cannot be quietly edited.

**Adopt this when** choices are being made that somebody will question later —
which is most of them past week one. **It costs you** twenty minutes at the
moment you would rather start coding. **Decline it** for choices you would not
mind having reversed without discussion.

**Not every choice is a decision record.** A directory of forty records nobody
reads is the same failure as no records at all. See *When one is required*.

---

## Shape

```markdown
# 0007 — a short claim, not a topic

**Status:** Accepted   ·   **Date:** 2026-09-08

## Context
What was true that made this need deciding. The constraint, not the wish.

## Decision
One paragraph. Imperative. What is now the case.

## Alternatives
What else was considered and why each lost. The most valuable section.

## Consequences
What this costs, including the thing that gets harder. A consequences
section with no cost in it is a decision that was not examined.

## Verification
The test, the check, or an explicit "not verified".
```

**The title is a claim.** `0008 — domain purity` is a topic. `0008 — a domain
module imports the error module and nothing else of ours` is a decision, and a
reader knows the answer without opening it.

---

## Written before the code

A record written afterwards is a **justification**, and the difference is
visible: a justification never has a real `Alternatives` section, because by then
the alternatives were not actually considered.

This is the same property that makes an oracle valid in
[`spec-tests.md`](spec-tests.md) — something written before the implementation
cannot have been derived from it.

---

## Status — a closed set

```
  Proposed     written, not yet agreed
  Accepted     in force
  Superseded   replaced — names the record that replaced it
  Rejected     considered and declined. KEPT, because the argument recurs
```

**`Rejected` earns its place.** A rejected decision that is deleted gets proposed
again in six months by somebody who does not know it was already examined.

---

## Accepted records are immutable

An accepted decision is not edited. When it stops being right, a **new** record
supersedes it; the old one gets a status change and a pointer, and nothing else.

The reasoning that was overturned is usually the most instructive part, and
editing it away leaves a repository whose decisions all appear to have been
correct first time.

**A record becomes immutable when it is *sealed*, not when it is marked
Accepted.** The gap between the two is the only window in which a mistake can be
corrected, and it should be minutes — seal it in the sitting you accept it.

---

## Every record names its verification

**A decision with no verification is a preference with a number.**

```
  Verification — `make check` fails the build if any module below the root
                 imports the root.
  Verification — not verified. This is a convention held by review, and
                 that is a known weakness.
```

**"Not verified" is an acceptable answer and an unacceptable omission.** Saying
it makes the gap visible; leaving it blank makes the gap look like an oversight
in the document rather than a hole in the discipline.

---

## When one is required

- the shape of stored data changes
- a contract another party builds against changes
- a dependency is added that will be hard to remove
- the project's declared scope changes
- **you are about to reverse something you already argued yourself out of**

If none of those apply, do not write one.

---

## Citation

**By full slug, never by number.** `[[0009-cohort-separator-and-width]]`, not
`[[0009]]`.

Numbers collide between a repository's own records and any shared set. A bare
number is ambiguous to a reader and **silently resolvable to the wrong document**
by a checker that searches one directory before the other. A slug cannot collide,
reads correctly without a lookup, and fails loudly when a record is renamed —
which is the property the check exists for.

**A rule cites the record that decided it.** That is what makes a rule followable
and the decision behind it findable.

**Across repositories, name the repository** — `flover-svelte ADR 0004`, never
`ADR 0004`. Numbers are per-repository and a reader cannot know which tree a bare
number belongs to.

---

## Sealing — how immutability is actually held

A rule that is not checked is a preference. Two properties make a sealing checker
worth more than a checksum.

**Verification never writes.** Sealing is a separate, deliberate act. A checker
that re-baselines on the run that fails converts a violation into a one-shot
signal that erases itself — the tampered version silently becomes the new truth,
and the second run is green. **This is why sealing does not belong in the same
runner as [`enforcement.md`](enforcement.md).**

**The status line is the only line that may ever change.** Store two hashes: the
whole file, and the file with the status line removed. The second is the
invariant and must match forever. That is what stops a supersede being used to
launder an edit — the command refuses when the body moved.

```bash
  verify                             # read-only. Non-zero on any problem
  verify --seal 0001                 # an Accepted record becomes immutable
  verify --supersede 0001 --by 0002  # status line only; body must be identical
```

Five states, because a checksum only distinguishes two:

```
  sealed, matching                intact
  sealed, body changed            TAMPERED     — supersede it, do not edit it
  sealed, status line changed     STATUS MOVED — use --supersede
  sealed, file gone               DELETED
  Accepted, never sealed          UNSEALED     — the correction window is open
```

**Chain each seal to the one before.** A per-record hash catches edits and cannot
catch deletion; the chain is what covers it — removing a record from the middle
breaks the chain rather than leaving a consistent-looking store.

**What it does not do.** The store is a file in a directory the author controls,
so it defends against edits and accidents and **not** against a determined author
rewriting both the record and the seal. This is **tamper-evident, not
tamper-proof**, and saying so is the difference between a useful check and a
claim that will be believed too far.

---

## Checklist

```
  [ ] the title is a claim, not a topic
  [ ] written before the code, not after
  [ ] Alternatives names what lost and why — not a formality
  [ ] Consequences contains an actual cost
  [ ] Verification names a check, or says "not verified" explicitly
  [ ] status is one of the four; Rejected records are kept
  [ ] sealed in the same sitting it was accepted
  [ ] cited by slug, with the repository named across trees
  [ ] the sealing checker never writes on a failing run
```
