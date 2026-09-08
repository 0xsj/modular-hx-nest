# Notes

> **Write only what the code cannot say.**
> Use as the work happens — never upfront, never as a documentation pass at the
> end. Ends in a corpus where the transferable half is separable from the
> disposable half without re-deriving which is which.

**Adopt this when** you intend to still be working on this in six months, or
intend the reasoning to outlive the repository. **It costs you** a few minutes
per file, at the moment you are least inclined to spend them. **Decline it** and
accept that every decision will be re-derived from the code, which records the
conclusion and never the alternative.

---

## What a note is for

A note answers *why this looks like this*, for a reader who can already see
*what* it does.

`Internal = iota` says the value is zero. It cannot say *"so that a value nobody
set fails safe."* The second is the note.

| A note records | A note does not record |
| --- | --- |
| the alternative that was tried and abandoned | what the function does |
| the failure mode a shape prevents | the parameter list |
| the trap that is invisible from the call site | anything the signature states |
| the consequence that made a rule worth having | a summary of the file |

**Restating the code is the failure mode**, and it is the one that rots a corpus
— a restatement is wrong the moment the code changes, and nothing detects it.

**A note that defends a shortcut is the worst kind.** If it exists to explain why
something is not good enough yet, either fix it or record it as a decision with a
trigger. A note is not where debt hides.

**Written as the work happens.** A note written before the work records an
intention; a note written after records a finding.

---

## The kind is the lifespan, and it decides the directory

The single most useful thing to decide up front, because it determines what
survives the project that produced it.

| kind | true of | goes stale when |
| --- | --- | --- |
| `module` | this file | the file changes |
| `substrate` | **this dependency, at this version** | **somebody else ships, and nothing tells you** |
| `pattern` | this architecture | you change architecture |
| `technique` | broadly | rarely |
| `language` | this language | a language release |
| `concept` | the domain | the domain changes |

**Directories, not tags.** The split is what makes the corpus portable:

```
  notes/
    modules/     ephemeral — 1:1 with code, and it is most of the corpus
    substrate/   dependency-scoped — carries to any project using that thing
    patterns/    ┐
    techniques/  │ transferable — what you come back to, and what
    language/    │ carries to the next project
    concepts/    ┘
```

**The ratio is lopsided and that is correct.** In one real corpus, 1,086 of 1,166
notes were module notes and **111 were transferable.** When that project was
restarted the 111 carried and the 1,086 did not — and knowing which was which
took no thought, because they were in different directories.

Two consequences:

- **A module note may cite a transferable note; never the reverse.** A
  transferable note that names a file in one project is not transferable. If a
  pattern needs an example, it names the shape, not the path.
- **A module note that starts explaining a general idea has outgrown its kind.**
  Extract it and link. That extraction is usually the moment the idea becomes
  clear.

---

## `substrate/` has four rules no other kind needs

Not what you wrote — what you are standing on. It is a distinct kind because it
has a distinct failure mode: **you can be confidently wrong about somebody else's
internals for years, and nothing in your repository will contradict you.**

**1 · Version-stamped, and this is not optional.** Every other kind goes stale
when *you* change something, so your own diff is the signal. Substrate goes stale
when somebody else ships, and there is no diff to notice.

```
  True of <dependency> 7.2 · verified 2026-09-04
  True of <runtime> 1.23's http client · read, not verified
```

**2 · It says whether you verified it or read it.** Most substrate knowledge is
second-hand and that is fine — but the two are different claims.

```
  Origin — the docs say so. Not tested here.
  Origin — measured: under this configuration, eviction samples 5 keys and
           evicts the oldest of THOSE, not the oldest overall.
```

The second is worth ten of the first. **A substrate note with no origin line is a
rumour with formatting.**

**3 · It cites the primary source** — the vendor document, the RFC section, the
source file, with a version. Not for bibliography: it is what you check when you
suspect the note has aged, and re-finding it costs more than recording it.

**4 · Write it when it bit you, not when you adopted the thing.** A note written
on adoption is a summary of the documentation, and the documentation is better at
that than you are. What is worth keeping is usually **the gap between the
documentation and the behaviour**, because that gap is what nobody else has
recorded.

> The test: **would this note have saved the afternoon it came from?** If no, it
> is a summary and the vendor already wrote it.

---

## Shape

```
  <claim>     ONE SENTENCE, before any heading
  Origin      what taught this — a bug, a build, a paper, a conversation
  What        one paragraph, for someone who has not read it
  Why         the reasoning. The alternative that lost, and why
  Example     the smallest real use. May be omitted if purely conceptual
  Gotchas     what surprises people. Often the most valuable section
  Used in     where this is actually used — NEVER omitted
  Related     links to other notes
```

### The claim line

**One sentence, before any heading, that is the note compressed.** Not a summary
of the topic — **a claim you could disagree with.**

```
  # Zero values, and using them to fail closed

  A zero value is a security decision, because "nobody set this" and
  "someone set this to the zero value" are indistinguishable.
```

*"This note is about zero values"* is a label. The sentence above is the thing
you would want to remember in a year.

This is what makes a corpus **reviewable rather than merely readable.** An index
generated from claim lines is a hundred sentences you can read in five minutes,
and the three you do not recognise are the three notes to open. Without it,
reviewing means re-reading, which nobody does twice.

**The test:** if the claim line and the title say the same thing, the claim line
is not finished.

### `Used in` may never be omitted

It is the section that rots first and the one that catches rot. A note whose
`Used in` names a caller that no longer exists is describing something that has
moved — and that is exactly what a checker can find.

### Confidence

A note is **settled** by default. When it is not, say so on the claim line:

```
  WORKING — this may be wrong. Two sources disagree and neither is tested here.
```

A working note never revisited becomes a settled one by silence, which is how a
hypothesis hardens into a rule nobody remembers agreeing to. Marking it costs one
word and makes the difference checkable.

---

## Roughly one note per file

A default, not a rule; nothing fails when it is not met. It sounds heavy and
mostly is not, because *write only what the code cannot say* does the filtering:
a file with nothing to add gets a short note saying what it is for and why it is
separate, and that is a complete note. When even that feels like invention, skip
it and write the note the day the file surprises somebody.

**The corpus is the architecture document.** A prose architecture document
restates the notes and becomes a second source of truth that drifts. The layering
is derivable from the code and the import rules are checks — neither needs prose.
What needs prose is the reasoning, and it lives beside the file it explains.

---

## Two audiences, two entry points

```
  RETRIEVAL   "I am about to do X"   → reading orders, indexed by intent
  REVIEW      "what do I know?"      → the claim index, generated not maintained
```

A reading order is a named intent and the two or three notes to read in sequence,
with a sentence on why that order:

```
  "I am about to start a design system"
      → cascade layers as a tier model, then two-tier colour tokens,
        then the three theme states.
        Precedence first, because it cannot be retrofitted.
```

Neither entry point is re-reading the corpus, which is the thing that does not
happen.

---

## Checklist

```
  [ ] the note says something the code cannot
  [ ] its kind is decided, and it is in that directory
  [ ] one claim line, before any heading, that could be disagreed with
  [ ] the claim line differs from the title
  [ ] Origin names what taught this — and whether it was measured or read
  [ ] substrate notes carry a version stamp and a primary source
  [ ] Used in is present and current
  [ ] no transferable note names a path in one project
  [ ] unsettled notes are marked WORKING
```
