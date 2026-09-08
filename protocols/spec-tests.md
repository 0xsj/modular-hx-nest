# Spec tests

> **Write tests from a specification behind an enforced information barrier, so they can catch a bug that already exists rather than pin whatever the code currently does.**
> Use when approaching testing for a package that has a doc comment, design notes, or a contract document; when a suite passes suspiciously easily; or when asking whether existing tests actually pin anything. Ends in mutation testing, which is what scores the result.

**Adopt this when** a module has an oracle that is not its own implementation —
a contract, design notes from a different build, or a doc comment written first.
**It costs you** the oracle-sanitising pass, a barriered writer, and a mutation
round; step 6 is what makes the rest worth anything. **Decline it** when no
oracle exists — this procedure cannot manufacture one, and tests written from
signatures alone are worth little. Write the doc first.

**A test derived from the implementation is a snapshot, not a specification.**
It asserts that the code does what the code does — passes on day one, inherits
every existing bug as an expectation, and can only ever catch a future
regression. This procedure produces tests that can disagree with the code, by
making sure the thing that writes them has never seen it.

Seven steps. Step 6 is not optional — it is what turns the result into
evidence. Step 7 is what lets somebody else check it.

---

## 1 · Find the oracle

The oracle is the source of truth about intended behaviour. It must not be the
implementation. In rough order of strength:

```
  a contract document, or a spec written before the code
  design notes written for a DIFFERENT build of the same thing
  the package doc comment
  the public API signatures alone
```

The second is counterintuitive and often the best available. A note carried from
an older build cannot have been derived from the code in front of you, and
independence is the property that matters — not freshness. A doc comment written
after the code by the same person partly inherits its assumptions.

**If no oracle exists, stop.** This procedure cannot manufacture one, and tests
written from signatures alone are worth little. Write the doc first.

## 2 · Sanitise the oracle, and measure what leaks

Design notes quote code. Grep the material for code blocks before spending an
agent on it:

```bash
awk '/^```/,/^```$/' oracle.md | grep -nE '<implementation idioms>'
```

Report what you find rather than silently stripping it. A **stale** fragment —
one describing a version that has since changed — is nearly harmless and can
even help, because it cannot rubber-stamp the current implementation. A
**current** fragment is a genuine leak and the tests derived from it are
snapshots of exactly that function.

**Two leaks that an idiom grep does not catch, both measured 2026-09-06:**

**`go doc -all` prints an exported variable's VALUE, not just its type.** A
`var Migrations = []Migration{{SQL: \`create table …\`}}` puts the entire DDL in
the oracle. Entry `0011` shipped with a real code fragment in it and a filed leak
surface of zero, because the grep looked for implementation idioms and this is
not one. Grep the generated oracle for the bodies of your own exported values,
or strip them.

**A note used as a second oracle can carry the results of a previous
measurement.** Entry `0014` passed `notes/substrate/rfc-9562-uuidv7.md` as a
second oracle; its *Used in* section described an earlier mutation round on that
same package and named a surviving mutant. The writer was handed the answer to
one of the four things it uniquely found. **Any document that cites a custody
entry is disqualified as an oracle unless the citation is stripped** — and in
this corpus every mature note cites one.

Generate the API surface without bodies. In Go:

```bash
go doc -all ./pkg/<name> > oracle/01-public-api.txt   # signatures + doc comments, no bodies
```

Verify it two ways, because there are two ways to get it wrong.

**No bodies leaked.** Grep the result for an implementation idiom you know is in
the source. Zero hits, or you have not built what you think you built.

**Nothing was silently truncated.** Confirm the extracted oracle still opens with
the document's first sentence. Doc extractors attach a comment to what follows
it, so an accidental blank line mid-comment splits the block and only the part
touching the declaration survives — `go doc` then reports a doc that begins in
the middle, with no error and no warning. The writer would receive a partial
spec, test exactly what it was given, and the gap would appear as coverage that
was never requested. Compare the oracle's first line to the source's.

## 3 · Spawn the writer behind an enforced barrier

Use the `spec-test-writer` agent. Its tool list is `Write` and nothing else, so
the barrier is an absence of capability rather than an instruction:

```
  no Read         cannot open a file — the oracle must be INLINE in the prompt
  no Bash         cannot compile, cannot iterate to green, cannot search
  no Grep/Glob    cannot find the source it is not allowed to read
```

Three tiers of barrier, and only the first is real:

| tier | mechanism | strength |
| --- | --- | --- |
| **enforced** | tool allowlist · external test package (compiler-enforced) | the violation is impossible |
| **auditable** | grep the agent transcript afterwards | the violation is visible |
| **instructed** | "do not read these files" | the violation is merely forbidden |

Pass the oracle material inline. If it does not fit in a prompt, the package is
too big for one pass — split by concern, not by file.

**Allocate the custody entry number and create `custody/evidence/NNNN/` BEFORE
spawning, and have the writer output there rather than to a scratchpad.** Two
things follow from it and both matter. The as-written suite is then preserved by
construction instead of by somebody remembering to copy it out of a
session-scoped directory. And the entry exists before the run, which is the only
way step 7's *"prediction recorded BEFORE running them"* enforces itself rather
than depending on whoever is reading these instructions carefully.

## 4 · Audit, then run them yourself

**The agent that wrote the tests must never be the one that sees them pass.**
That is the whole reason it has no compiler.

Audit the transcript before trusting anything:

```bash
grep -oE '"(file_path|command)":"[^"]+"' <transcript> | sort -u
```

Every path it touched should be an oracle file or its own output. Then compile
and run.

**A test that does not compile is expected**, not a failure of the method — the
writer had no type checker. Fix compile errors mechanically. Never fix one by
changing an expectation.

## 5 · Triage every failure as a finding first

A failing test is a claim about the code. It stays a claim until a human
demonstrates otherwise. The order matters: **read the oracle, then the test, then
the implementation.** Reading the implementation first is how a real bug gets
reclassified as a bad test in thirty seconds.

Three outcomes, and name which one you reached:

```
  the code is wrong        -- fix the code. This is the method paying for itself
  the spec is wrong        -- fix the spec, THEN the test. Never the test alone
  the spec was ambiguous   -- a decision is owed. Record it, then write the test
```

## 6 · Mutation-test the survivors — this is the scoring step

**A first-run pass tells you nothing either way.** It is consistent with a
perfect suite against correct code, and equally consistent with a vacuous suite
that asserts nothing. Only mutation testing separates them, and it does not care
whether the barrier held: if the oracle leaked and the suite still kills every
mutant, you got a good suite anyway.

Break the code deliberately, one change at a time, and record what dies:

```
  move the fail-closed constant off zero
  make a copy share its backing storage
  flip a quantifier — ALL becomes ANY
  delete a guard clause
  drop one member from a set-membership test
  restore a bug you previously fixed          <- the strongest single check
```

Automate it, and get the restore right, because there are two ways to get it
wrong and the second is worse.

**Restore in a `finally`.** A crashing harness that leaves the tree mutated is
worse than no harness.

**Restore ONLY the file being mutated, from content read at the moment of
mutation.** Never a package-wide snapshot, and never one taken earlier in the
session. A harness that restores a whole directory from a stale backup silently
reverts every legitimate edit made since — a spec amendment, a test added after
the last round — and then reports the mutants as *survivors*, because the tests
that would have killed them were rolled back before the run. The crash leaves the
tree visibly broken; this one leaves it looking clean and hands you a plausible
wrong answer, which is the failure that actually costs you an afternoon.

```python
original = read(path)               # read at mutation time, not before
try:
    write(path, mutate(original))
    run_tests()
finally:
    write(path, original)           # only this file, only this content
```

**A mutation that does not compile is INVALID, not killed — and the check must be
explicit.** `go test` reports a build failure with `FAIL … [build failed]` on
stdout and a non-zero exit, which is indistinguishable from a test failure to any
classifier looking at the exit code. Build first, and only run the suite if the
build succeeded; otherwise a mutation that deletes a line and orphans an import
scores as a kill and inflates the ratio. This is the failure direction that
flatters you, so it is the one to guard.

**A subprocess that never ran is not a kill.** The same argument one step
further out: a non-zero exit is equally consistent with a failing test, a build
error and a *missing binary*, and two of those three inflate the ratio. Use the
test runner's own timeout flag — `go test -timeout` — rather than a `timeout`
wrapper. GNU coreutils is not on macOS, so wrapping the runs in a command that
does not exist kills every one of them with `command not found` and scores a
perfect result out of a harness that ran nothing. That produced a false 52-of-52
on entry `0008` and was one check away from being filed.

**Give the harness a negative control.** Pick one case whose outcome must be the
opposite — a mutation that cannot survive, a test that cannot be red — and check
it before you trust anything else. A uniform result is the shape this method
flatters itself with, and a broken harness produces it far more reliably than a
good suite does.

**A survivor is not automatically a hole.** Check for an *equivalent mutant*
first — a change with no observable behavioural difference. A guard against a
condition that cannot currently occur is correct and unkillable; introduce the
condition and confirm the suite fires then. That is the difference between
*untested* and *untestable-in-isolation*, and only the first is a gap.

Report the ratio. `8/8 killed, 1 equivalent mutant` is a result. `186 tests
passing` is not.


**A runner may not amend the specification.** Step 5 says to fix the spec and
then the test — that is the AUTHOR's job, on a separate pass. A runner has read
the implementation; an amendment it writes and then measures a barriered writer
against has closed the loop this whole procedure exists to open, and the leak
arrives laundered. Record what you found and recommend the sentence. Do not
supply the next oracle.

## 7 · Write the custody entry

The run is not finished until somebody who was not present can check it. The
entry directory was created at step 3 and already holds the as-written suite;
fill in the rest. Record, in a directory outside the code:

```
  oracle        sha256 of every file passed in, and where each came from
  leak surface  code fragments found in the oracle, counted and quoted
  grant         the tool allowlist the writer was given, and the tier it bought
  prediction    which tests it said would fail — recorded BEFORE running them
  audit         every path the transcript shows it touched
  result        compile, pass/fail, and the mutation ratio
  subject       sha256 of the suite and of the sources it ran against
```

The subject hashes are what keep working. Hand-edit the suite later against the
implementation and the hash stops matching, so the provenance claim visibly
ceases to cover what is in the tree rather than silently continuing to imply it.

**Hash the prose entry too, not only the evidence.** A verifier that checks the
attachments and not the argument is checking the cheap half — the write-up is
what anyone actually reads, and it must not be freely rewritable while the
verifier stays green.

**Record runs that went badly, in the same detail.** A custody record that accumulates
only clean runs is a marketing document, and the first inconvenient entry is what
establishes whether any of the others mean anything. Name the barrier tier
honestly: `enforced` only when the writer's tool allowlist made the violation
impossible, `instructed` when it was merely forbidden.

---

## What this cannot do

- **It cannot exceed its oracle.** Tests derived from a doc pin the doc's
  mistakes, faithfully. If a rule is missing from the spec, it will be missing
  from the suite and nothing will say so.
- **It cannot test a discipline.** *Return or log, never both*, or *this
  package's shim never gains logic*, are review properties. Say so rather than
  approximating them.
- **It cannot settle an arbitrary decision.** Where behaviour is genuinely a
  choice, a test can only pin it once the choice is written somewhere that is
  not the code.
