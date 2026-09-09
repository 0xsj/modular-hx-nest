# 0001 · Spec tests written behind a barrier for `src/lib/kernel/failure.ts`

2026-09-09 · subject `src/lib/kernel/failure.ts`, specified by
`src/lib/kernel/failure.doc.ts` · written by an agent that took no part in the
run, from `custody/evidence/0001/` alone

> Barrier tier: **enforced** — as claimed. The one fact that most complicates
> this run is that the claim has no runtime witness. `evidence/0001/` holds no
> transcript, no tool log and no agent definition; the sole record of the grant
> is `03-grant.txt`, a prose file the runner wrote describing the grant it says
> it issued. `protocols/custody.md` names capability and the runtime's own
> record as the two things custody can genuinely prove, and this directory
> contains neither in a form independent of the runner's account. Everything
> below is marked for which of the two it rests on.

---

## What was different about this run

**The oracle is not wholly pre-implementation, and the specification says so in
the copy that stayed in the tree.** `failure.doc.ts` carries, under F1a, the
heading `### AMENDED after implementation — added because it was missing`. F1a
is therefore a clause added after `failure.ts` existed, in response to a
mutation that survived an earlier round. The other nineteen clauses are claimed
as pre-implementation; nothing in evidence dates any of them. So the oracle rank
is *contract document written before the code*, with one clause out of twenty
that demonstrably was not, and the run traded a slightly weaker independence
claim for a contract that closes a known hole.

**Two removals were made before the specification was handed over, and both are
reconstructible from the tree.** Diffing `failure.doc.ts` against
`01-specification.md` as sets of non-blank lines gives 26 lines present in the
doc and absent from the oracle, and — this is the part worth checking — **zero
lines present in the oracle and absent from the doc.** The sanitisation was
purely subtractive; nothing was paraphrased or invented. The 26 break down as:

```
  11  the F1a amendment narrative. It named the surviving mutant
      (`forbidden` deleted from TRANSPORT_KINDS) and explained why the
      previous round missed it — a document carrying the results of a
      prior measurement, handed to the agent being measured
  14  the oracle banner. Procedure meta: "THIS DOCUMENT IS AN ORACLE",
      the module-doc-versus-tier-doc rationale, the two rule lines
   1  `export {};`, the TypeScript module marker
```

The **F1a clause itself was retained**; only its narrative went. The oracle still
opens on the document's first sentence verbatim, and all twenty clauses
(F1, F1a, F2..F19) are present. Grepping the sanitised oracle for `mutant`,
`mutation`, `survivor`, `survived`, `killed`, `oracle`, `barrier`, `spec-test`
and `amendment` returns nothing.

**The second oracle input is a bodiless API surface, and bodiless is not the
same as clause-free.** `02-public-api.d.ts` survives the runner's idiom grep —
no `for (`, no `Object.entries`, no `.includes(`, no `while (` — but its JSDoc
restates ten of the twenty clauses by number (F3, F6, F7, F9, F11, F12,
F13/F14, F15, F16–F18, F19) with rationale, and its `readonly [...]` tuples
print the literal membership of `TRANSPORT_KINDS`, `DOMAIN_KINDS` and
`FAILURE_KINDS`. That is a second statement of half the contract, worded by the
implementer after the implementation existed. It does not leak the body. It does
mean F1a and F7 could be satisfied from the type surface without reading the
specification at all, so a test citing those clauses proves less about oracle
independence than a test citing F5 or F14.

---

## Result

Both suites compile and both are green. Re-run here today, from the files in
evidence:

```
  as-written suite   183 / 183 passing
  committed suite    203 / 203 passing
  tsc --noEmit         0 errors under src/     (295 in node_modules; see below)
```

**The triage table is empty, and that is the result.** No test the writer
produced failed, on any run. There is therefore nothing to attribute to a spec
gap, a code bug or an ambiguity — the suite and the implementation did not
disagree once. The runner records that the writer predicted "None with high
confidence" and flagged three clauses as most likely to catch a real bug
(F7 `retryAfter: 0`, F8 absent-not-undefined, F14 cycle termination), and that
all three passed; there is no prediction artifact in evidence, so the prediction
and its outcome rest on the runner's word alone.

A run with zero disagreements produces no evidence about the suite from the run
itself. It could mean the implementation is correct against its specification;
it could mean the tests are vacuous. Nothing before the mutation round
distinguishes those.

---

## The mutation score, and what it measured

13 mutants, one per contract clause with a caller. **The mutants were chosen by
the same session that wrote both the module and the specification** — so the
ratio is a property of that pair, bounded by that session's imagination, not a
property of the suite alone.

```
  first pass    11 killed / 2 survived / 0 invalid
  second pass   12 killed / 1 equivalent / 0 invalid
```

Both survivors classified:

**Survivor A — F5, "message is passed through unchanged". A genuine hole in the
suite.** The as-written suite exercised F5 with four messages: `"simple"`, `""`,
`'quotes "like this" and\nnewlines'`, `"unicode ☺ 日本語"`. Not one has leading
or trailing whitespace, so a constructor that silently called `.trim()` returned
all four byte-identical and passed every assertion. This is the one survivor
whose diagnosis is checkable without the harness: read the four literals in
`suite-as-written.test.ts` and the conclusion follows. **Fixed in the suite, not
in the specification and not in the code** — two discriminating inputs added,
`"  surrounded by spaces  "` and `"\ttabbed\n"`. F5 was already correct; the
tests asserting it were asserting nothing.

**Survivor B — F11, "`isTransport` answers from domain". An equivalent mutant.**
The argument is followable from the artifacts: `02-public-api.d.ts` declares
`isTransport: (failure: Failure) => failure is TransportFailure`, `Failure` is
closed over exactly ten kinds, and F11 scopes itself to "every constructible
failure". Over that closed union the two implementations disagree on zero kinds;
they differ only for a kind the type system forbids. No test can kill it, and
one that could would be testing something F11 explicitly declines to say.

So: **12 of 13 mutants killed, the thirteenth unkillable by construction, one
real defect in the suite found and repaired.** The runner records that the
harness classified a non-compiling mutant or an unparseable test count as
INVALID rather than as a kill, and ran unmutated controls at both ends which
both passed, with an empty `git diff` afterwards — the negative control
`protocols/custody.md` asks for. **No mutant list, no harness script and no run
log are in evidence.** The entire mutation round is unreproducible from this
directory.

---

## Provenance

```
  01-specification.md      src/lib/kernel/failure.doc.ts, sanitised — the two
                           removals above. Verified subtractive-only
  02-public-api.d.ts       emitted from failure.ts with
                           tsc --declaration --emitDeclarationOnly
  03-grant.txt             written by the runner, describing the grant
  04-hashes.txt            written by the runner; recomputes clean today
  suite-as-written.test.ts the writer's output before any human edit
```

`04-hashes.txt` verifies: all seven entries — the four evidence files plus
`failure.ts`, `failure.test.ts` and `failure.doc.ts` — recompute to the recorded
digests. It is a flat list, not a chain, and it was written by the party being
checked, so it fixes the tree against *later* drift and says nothing about the
tree during the run.

The as-written and committed suites differ by **one hunk**, at line 130 of the
as-written file: the F5 `messages` array, +9 lines / −1 line, net +8, six
messages where there were four, with a comment naming this custody directory.
Nothing else moved. `failure.ts` is untouched by the F5 fix.

`typescript` is **not a dependency of this project** — absent from `package.json`
and from `node_modules`. `tsc` here resolves to a global 5.5.4, which produces
295 errors inside `@ark-ui/solid`'s own declarations and zero under `src/`. The
compiler that emitted `02-public-api.d.ts`, and the one behind the runner's
type-check claim, is not pinned by the repository and its version is recorded
nowhere in evidence.

Git: `custody/` and all three `failure.*` files are untracked. Nothing about this
run is committed.

---

## What this record cannot prove

- **That the barrier held.** `03-grant.txt` asserts an enforced tier —
  `Write` only, no `Read`, no `Bash`, no `Grep`/`Glob` — and the grant file's
  own honest limit is right that a grant bounds access, never prior knowledge.
  But the file is a description. The agent definition it describes, and any
  runtime log of what the writer actually called, are not here. Enforced is the
  tier as recorded; **instructed is the tier this directory can demonstrate.**
- **The audit.** That exactly one file was created, at the given output path,
  and that nothing else in the tree was newer than the grant file, is the
  runner's account of an audit whose input — the transcript — was not kept.
  `protocols/spec-tests.md` §7 asks the entry to record "every path the
  transcript shows it touched". There is no transcript.
- **That `failure.ts` was unmodified across the run.** Its hash matches
  `04-hashes.txt` today; both were recorded after the run by the same party.
- **The prediction.** Not in evidence. The suite's own header refers to "the
  accompanying report for the full list" of `[inference]` markers — that report
  was not preserved either.
- **The mutation round.** See above. The ratio is the one number
  `protocols/custody.md` says needs no trust, and here it needs trust, because
  nothing in the directory lets a stranger re-derive it.
- **Anything about what the writer already knew.** The module and its
  specification were authored in the same session as the run. For a module this
  new the distinction is thin, but it is the distinction custody explicitly
  cannot close.

**Nothing is sealed.** This repository has no `manifest.json`, no hash chain and
no `verify.sh`; `custody/` contains this file and `evidence/0001/` and nothing
else. `protocols/spec-tests.md` §7 asks that the prose entry be hashed too, so
that the argument cannot be rewritten while a verifier stays green — that is not
done. This entry is freely rewritable, and the only integrity guarantee over it
is git.

---

## Things that went wrong

- The suite shipped a clause it was not testing. F5 had four assertions and no
  discriminating input; only the mutation round caught it. Whatever the suite
  proves about the other nineteen clauses, it proved nothing about F5 for the
  duration of the first pass.
- The oracle handed over had to have a prior measurement stripped out of it.
  That the strip was caught is the process working; that an amendment narrative
  naming a surviving mutant was living inside the specification at all is the
  cost of amending an oracle in place.
- Four of the seven artifacts `protocols/spec-tests.md` §7 asks for — the
  transcript, the audit, the prediction, the mutation log — were not written to
  `evidence/0001/`. Three of them are perishable; `protocols/custody.md` is
  explicit that a claim with nothing behind it is worse than no entry, because
  it reads as evidence.
- The independent re-run below was done with a global TypeScript the project
  does not pin, because the project pins none.

---

## Verification

From the repository root:

```bash
# every recorded hash, including the subject sources
shasum -a 256 -c custody/evidence/0001/04-hashes.txt

# the committed suite            expect 203 / 203
npx vitest run src/lib/kernel/failure.test.ts

# the suite as the writer produced it, before the F5 fix   expect 183 / 183
cp custody/evidence/0001/suite-as-written.test.ts src/lib/kernel/__aw.test.ts
npx vitest run src/lib/kernel/__aw.test.ts ; rm src/lib/kernel/__aw.test.ts

# the only divergence between the two suites: one hunk, F5's messages array
diff -u custody/evidence/0001/suite-as-written.test.ts src/lib/kernel/failure.test.ts

# sanitisation was subtractive only — the second command must print nothing
perl -pe 's{^/\*\*$}{}; s{^ \*/$}{}; s{^ \* ?}{}; s{^ \*$}{}' \
  src/lib/kernel/failure.doc.ts | grep -v '^[[:space:]]*$' \
  | perl -pe 's/[ \t]+$//' | sort > /tmp/doc.txt
grep -v '^[[:space:]]*$' custody/evidence/0001/01-specification.md \
  | perl -pe 's/[ \t]+$//' | sort > /tmp/spec.txt
comm -23 /tmp/doc.txt /tmp/spec.txt      # 26 lines: 11 + 14 + `export {};`
comm -13 /tmp/doc.txt /tmp/spec.txt      # nothing

# all twenty clauses survived sanitisation, and no prior result did
grep -cE '^  F[0-9]+a? ' custody/evidence/0001/01-specification.md   # 20
grep -niE 'mutant|mutation|survivor|killed|barrier' \
  custody/evidence/0001/01-specification.md                          # no match

# no implementation body in the API oracle
grep -nE 'for \(|Object\.entries|\.includes\(|while \(' \
  custody/evidence/0001/02-public-api.d.ts                           # no match
```

There is no `custody/verify.sh` to run. The commands above are the whole of it.
