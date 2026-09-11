import { tests } from "./cases.mjs";
import ts from "typescript";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const evidence = mkdtempSync(join(tmpdir(), "flover-resilience-mutations-"));
const workspace = join(evidence, "workspace");
const excluded = new Set([
  ".git",
  "node_modules",
  ".next",
  ".output",
  ".vinxi",
  "dist",
  "build",
  "artifacts",
  ".agents",
  ".codex",
]);
cpSync(root, workspace, {
  recursive: true,
  filter: (path) =>
    !relative(root, path)
      .split(/[\\/]/)
      .some((part) => excluded.has(part)),
});
symlinkSync(join(root, "node_modules"), join(workspace, "node_modules"), "dir");
const note = "src/lib/runtime/save-draft.ts";
const mutations = [
  {
    id: "bypass-decoding",
    file: "src/lib/http/response.ts",
    from: "const decoded = read(value);",
    to: "const decoded = value as T;",
  },
  {
    id: "validate-only-first-item",
    file: "src/lib/http/response.ts",
    from: "for (const raw of value)",
    to: "for (const raw of value.slice(0, 1))",
  },
  {
    id: "accept-obsolete-responses",
    file: "src/lib/runtime/latest-read.ts",
    from: "if (own !== generation || signal.aborted) return;",
    to: "// Obsolete responses are deliberately accepted.",
  },
  {
    id: "erase-last-good-data",
    file: "src/lib/runtime/latest-read.ts",
    from: 'settled = { state: "failed", failure: result.error, previous };',
    to: 'settled = { state: "failed", failure: result.error, previous: undefined };',
  },
  {
    id: "lose-response-before-commit",
    file: "src/lib/chaos/sequence.ts",
    from: "const result = await inner.request<T>(method, path, { ...options, signal });",
    to: 'const result = effect?.kind === "lose-response" ? ok(undefined as T) : await inner.request<T>(method, path, { ...options, signal });',
  },
  {
    id: "allow-unresolved-second-write",
    file: note,
    from: 'if (["saving", "checking", "unknown"].includes(current.phase.state)) return;',
    to: 'if (["saving", "checking"].includes(current.phase.state)) return;',
  },
  {
    id: "overwrite-newer-draft",
    file: note,
    from: 'transition({ ...store.get(), baseline: structuredClone(receipt.draft), confirmed: receipt, phase: { state: "ready" } });',
    to: 'transition({ ...store.get(), baseline: structuredClone(receipt.draft), draft: receipt.draft, confirmed: receipt, phase: { state: "ready" } });',
  },
  {
    id: "treat-failed-check-as-absence",
    file: note,
    from: "if (!result.ok) uncertain(attempt, result.error);",
    to: 'if (!result.ok) updatePhase({ state: "not-recorded" });',
  },
  {
    id: "send-without-checkpoint",
    file: note,
    from: 'if (!checkpoint.ok) { updatePhase({ state: "refused", failure: checkpoint.error, submitted: attempt }); return; }',
    to: "// Continue even though recovery cannot be checkpointed.",
  },
  {
    id: "accept-stale-item-revision",
    file: "src/lib/services/example/item-workflow.fixtures.ts",
    from: "if (current.revision !== attempt.expectedRevision)",
    to: "if (false)",
  },
  {
    id: "forget-committed-item-receipt",
    file: "src/lib/services/example/item-workflow.fixtures.ts",
    from: "receipts: [...data.receipts, receipt]",
    to: "receipts: data.receipts",
  },
  {
    id: "resume-another-account",
    file: "src/lib/runtime/session-recovery.ts",
    from: "if (result.value.accountId !== accountId)",
    to: "if (false)",
  },
  {
    id: "expire-on-forbidden",
    file: "src/lib/runtime/session-recovery.ts",
    from: 'if (failure.kind === "unauthenticated") expire();',
    to: 'if (failure.kind === "unauthenticated" || failure.kind === "forbidden") expire();',
  },
  {
    id: "retain-grants-during-refresh",
    file: "src/lib/runtime/capabilities.ts",
    from: 'store.set({ state: "loading" });',
    to: "// Keep the old grant while refreshing.",
  },
  {
    id: "stop-watching-cancels-job",
    file: "src/lib/runtime/job-observer.ts",
    from: "readGeneration++; reader?.abort(); update({ watching: false, refreshing: false });",
    to: "readGeneration++; reader?.abort(); void port.cancel(id, new AbortController().signal); update({ watching: false, refreshing: false });",
  },
  {
    id: "accepted-cancel-invents-terminal-state",
    file: "src/lib/runtime/job-observer.ts",
    from: "await refresh();",
    to: 'await refresh(); if (result.ok && result.value.accepted) update({ job: { ...store.get().job!, state: "canceled" } });',
  },
  {
    id: "ignore-explicit-time-zone",
    file: "src/lib/locale/index.ts",
    from: "timeZone: context.timeZone, dateStyle:",
    to: 'timeZone: "UTC", dateStyle:',
  },
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const subjects = [
  ...new Set([...tests, ...mutations.map((mutation) => mutation.file)]),
];
const report = {
  provenance:
    "Implementation-visible ordinary tests; curated mutations, not a blind spec-test run.",
  isolation: "A temporary source copy; the working tree is never mutated.",
  hashes: Object.fromEntries(
    subjects.map((file) => [file, hash(readFileSync(join(workspace, file)))]),
  ),
  controls: [],
  mutations: [],
};

function run(id) {
  const compile = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--incremental",
      "false",
    ],
    { cwd: workspace, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (compile.error || compile.signal || compile.status === null)
    throw new Error(
      `Compiler did not complete: ${compile.error ?? compile.signal}`,
    );
  writeFileSync(
    join(evidence, `${id}.typecheck.log`),
    compile.stdout + compile.stderr,
  );
  if (compile.status !== 0) return { id, outcome: "invalid", failedTests: 0 };
  const output = join(evidence, `${id}.tests.json`);
  const tested = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/vitest/vitest.mjs"),
      "run",
      ...tests,
      "--reporter=json",
      `--outputFile=${output}`,
    ],
    { cwd: workspace, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  writeFileSync(
    join(evidence, `${id}.runner.log`),
    tested.stdout + tested.stderr,
  );
  if (tested.error || tested.signal || !existsSync(output))
    throw new Error(
      `Test runner did not complete: ${tested.error ?? tested.signal ?? tested.stderr}`,
    );
  const result = JSON.parse(readFileSync(output, "utf8"));
  if (
    !result.numTotalTests ||
    result.numRuntimeErrorTestSuites ||
    (tested.status !== 0 && !result.numFailedTests)
  )
    throw new Error(`No assertion-based result for ${id}; inspect ${output}`);
  return {
    id,
    outcome: result.numFailedTests > 0 ? "killed" : "survived",
    failedTests: result.numFailedTests,
    totalTests: result.numTotalTests,
  };
}

/** Token matching survives formatting without broad string/regex replacements.
 * Exactly one contiguous token sequence must match, or the run is incomplete. */
function tokens(source) {
  const parsed = ts.createSourceFile(
      "subject.ts",
      source,
      ts.ScriptTarget.Latest,
      true,
    ),
    out = [];
  function walk(node) {
    const children = node.getChildren(parsed);
    if (children.length) {
      children.forEach(walk);
      return;
    }
    if (node.kind === ts.SyntaxKind.EndOfFileToken || !node.getWidth(parsed))
      return;
    out.push({
      key: `${node.kind}:${ts.isStringLiteral(node) ? node.text : node.getText(parsed)}`,
      kind: node.kind,
      start: node.getStart(parsed),
      end: node.getEnd(),
    });
  }
  walk(parsed);
  return out.filter(
    (token, index) =>
      !(
        token.kind === ts.SyntaxKind.CommaToken &&
        [
          ts.SyntaxKind.CloseBraceToken,
          ts.SyntaxKind.CloseBracketToken,
          ts.SyntaxKind.CloseParenToken,
        ].includes(out[index + 1]?.kind)
      ),
  );
}

function measure(mutation) {
  const file = join(workspace, mutation.file),
    original = readFileSync(file, "utf8");
  const haystack = tokens(original),
    needle = tokens(mutation.from),
    matches = [];
  for (let i = 0; i <= haystack.length - needle.length; i++)
    if (needle.every((token, j) => token.key === haystack[i + j].key))
      matches.push([haystack[i].start, haystack[i + needle.length - 1].end]);
  if (matches.length !== 1)
    throw new Error(
      `Mutation ${mutation.id} must match exactly once in ${basename(file)}; found ${matches.length}.`,
    );
  const [start, end] = matches[0];
  try {
    writeFileSync(
      file,
      original.slice(0, start) + mutation.to + original.slice(end),
    );
    return run(mutation.id);
  } finally {
    writeFileSync(file, original);
  }
}

try {
  const baseline = run("baseline");
  if (baseline.outcome !== "survived")
    throw new Error(
      "Baseline must typecheck and pass before mutation scoring.",
    );
  report.controls.push(baseline);
  console.log(`Baseline: ${baseline.totalTests} tests pass.`);
  for (const mutation of [
    {
      id: "control-no-behavior-change",
      file: "src/lib/http/response.ts",
      from: "const decoded = read(value);",
      to: "const decoded = read(value); // Equivalent control.",
    },
    {
      id: "control-type-error",
      file: "src/lib/http/response.ts",
      from: "const decoded = read(value);",
      to: "const decoded: never = read(value);",
    },
  ])
    report.controls.push(measure(mutation));
  if (
    report.controls[1].outcome !== "survived" ||
    report.controls[2].outcome !== "invalid"
  )
    throw new Error(
      "Negative controls were misclassified; do not trust a mutation score.",
    );
  for (const mutation of mutations) {
    const result = measure(mutation);
    report.mutations.push(result);
    console.log(
      `${result.id}: ${result.outcome} (${result.failedTests} failed tests)`,
    );
  }
  const killed = report.mutations.filter(
    (result) => result.outcome === "killed",
  ).length;
  report.summary = `${killed}/${mutations.length} curated mutants killed; equivalent and compile-error controls classified correctly.`;
  console.log(report.summary);
  if (killed !== mutations.length) process.exitCode = 1;
} catch (error) {
  report.error = String(error);
  console.error(error);
  process.exitCode = 1;
} finally {
  writeFileSync(join(evidence, "report.json"), JSON.stringify(report, null, 2));
  console.log(`Evidence: ${join(evidence, "report.json")}`);
}
