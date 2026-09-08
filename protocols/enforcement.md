# Enforcement

> **A discipline that is not a failing check is a preference.**
> Use when a convention matters enough to argue about, when a boundary keeps
> getting crossed, or before writing a rule down in prose and hoping. Ends in a
> detection method per rule — and an honest list of the rules that have none.

**Adopt this when** more than one person, or more than one session, edits the
tree. **It costs you** a config file and the discipline of writing `Detect`
before `Statement` feels finished. **Decline it** for a spike you intend to
delete — but not for "we all know the rule", which is the condition this exists
for.

---

## Why conventions decay silently

A convention held by review is one deadline away from not being true, and
nothing announces the day it stops. The tree still builds. The tests still pass.
The rule is still written down, which is the part that makes it worse — the
document keeps asserting something that has quietly become false.

**The failure is not that somebody broke the rule. It is that nothing could tell
you.**

---

## How a rule is written

Four fields. A rule missing the second is not a rule.

| Field | Meaning |
| --- | --- |
| **Statement** | What must be true. Normative |
| **Detect** | How a check finds a violation |
| **Message** | What the failure prints — names the file *and* the rule id |
| **Exempt** | What is deliberately excluded, and why |

**A rule with no detection method is a guideline.** It belongs in the document
that states it, not here. Keep a list of those; see *What is not enforced*.

```
### S3 · Framework imports are confined
- Statement — framework imports appear only in the binding tier
- Detect    — resolve each file to a tier by path; flag framework imports elsewhere
- Message   — `components/table imports next/navigation — only bindings may (S3)`
- Exempt    — test files
```

**The message names the rule id** so a failure is traceable back to the document
that argued for it, and so a reader can decide whether the rule is wrong rather
than only whether the code is.

---

## Families

Group by what they protect, and give each an id prefix so a message can cite one.

| | Protects | Typical detection |
| --- | --- | --- |
| **S** · Structural | import boundaries, tier ordering | resolve path → tier, check the edge |
| **T** · Tokens | no raw values where a token exists | parse stylesheets for literals |
| **P** · Primitives | component anatomy, one variant mechanism | lint per file shape |
| **A** · Accessibility | the floor | see [`accessibility.md`](accessibility.md) |
| **D** · Decisions | records are sealed, cited by slug | see [`decisions.md`](decisions.md) |
| **N** · Notes | a module without a note does not ship | see [`notes.md`](notes.md) |
| **R** · Repository | every specified rule is implemented | the runner checks itself |

**R is the one people skip and the one that keeps the rest honest.** A rule
specified in a document and absent from the runner is worse than an unwritten
rule, because the document is read as a guarantee.

---

## The seams worth encoding first

A dependency you own through one file is replaceable; one imported in forty
places is load-bearing. The rule is the same each time — **whatever wraps a
third-party library is the only thing that imports it** — and it is only real if
a check says so.

```jsonc
{ "id": "S4", "from": "app/**", "deny": ["<headless-lib>/**"],
  "message": "a screen imports the wrapper, never the library (S4)" }

{ "id": "S5", "from": "**", "deny": ["<icon-lib>"], "allowFiles": "components/utility/icon/**",
  "message": "one file of named re-exports — the icon set stays countable (S5)" }

{ "id": "S6", "from": "app/**", "deny": ["lib/http/**"],
  "message": "nothing above the service tier names HTTP (S6)" }

{ "id": "S7", "from": "lib/services/**", "deny": ["<framework>"],
  "message": "a service is plain async code — importing the framework makes it a binding (S7)" }
```

**S7 is the load-bearing one in a multi-framework series.** It is what keeps the
service and transport tiers identical across projects. If it holds, the port is
genuinely headless and the frameworks differ only above it. If it does not, there
are three codebases rather than one system with three shells.

---

## Three things that turn a correct check into a useful one

Each of these made a technically-right rule usable. They are recorded because
the next person hits them.

**1 · A trailing `/**` must match the bare prefix.** `lib/http/**` has to match
`lib/http`, because that is the shape most import paths take. Without it, a rule
allowing a package's subtree silently refuses the package itself — firing on
exactly the imports it was written to permit.

**2 · A layer rule must be scoped, or it drowns.** A module importing its own
sibling is the design, not a violation. Unscoped, one layer rule produced **489
findings against correct code.** Exempt the same group; layers govern the space
*between* units, and a separate rule governs the space inside one.

**3 · A path check must know what a path looks like.** Notes are full of
shorthand, and a backticked token in a table is not a claim that a file exists.
Treating every backticked token as a path produced **604 findings against a
corpus with none.** Declare which directory prefixes count as a citation.

> The pattern in all three: **a check that is mostly wrong trains people to
> ignore it, which is worse than not having the check.** A rule's precision is
> part of the rule, not a detail of its implementation.

---

## Two ways a green run means nothing

**Zero files is indistinguishable from zero violations.** An `include` that
matches nothing must **fail**, not pass. A first version of one engine fell back
to another language's extensions, never opened the files it was pointed at, and
reported green — the rules had never run.

**A check that cannot fail is not a check.** Give the runner a case that must be
caught, and confirm it is. This is the same negative control that
[`render-verification.md`](render-verification.md) requires of a probe, for the
same reason: a harness that never ran is perfectly consistent, because nothing
varies when nothing executes.

---

## Turning a rule off

Explicitly, in config, **with a reason** — so the runner stops reporting it as
missing and a reader can judge the reason:

```jsonc
"rules": {
  "N1": "no modules declared yet; there is nothing to note",
  "T3": false                          // ← not acceptable
}
```

**Silence is not an answer.** A rule off because it does not apply here should
say so. A rule off because it is inconvenient is a preference wearing a config
key, and the difference is visible only if the reason is written.

---

## What is not enforced, and why

Naming these keeps them from being mistaken for guarantees.

| Rule | Why it resists detection |
| --- | --- |
| No domain vocabulary in a primitive | the denylist is per-product; a parser cannot know `Ledger` is a domain and `Layout` is not |
| A client permission check that *replaces* a server check | that is a fact about the server, invisible here |
| Whether a compact density is *usable* | tokens are checkable; legibility is visual |
| Whether a token is used *meaningfully* | that `--ink-3` was chosen over `--ink-2` for a reason is a judgement |

A document that lists only what it catches is read as complete. Listing the gaps
is what makes the rest trustworthy.

---

## Checklist

```
  [ ] every rule has Statement · Detect · Message · Exempt
  [ ] every message names the rule id
  [ ] R — every rule specified in a document is implemented in the runner
  [ ] the engine fails when an include matches zero files
  [ ] a negative control ran and was caught
  [ ] every disabled rule carries a reason, not `false`
  [ ] the undetectable rules are listed where the detectable ones are
```
