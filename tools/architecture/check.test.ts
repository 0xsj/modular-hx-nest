// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  symlink,
} from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkArchitecture,
  changedFiles,
  exitCode,
  inventory,
} from "./check.mjs";
import { POLICY, RULES, validateRules } from "./rules.mjs";

// Implementation-aware negative controls. These are not blind spec tests.
const temporary: string[] = [];
const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
const mechanical = RULES.filter((rule) => rule.mode === "mechanical").map(
  (rule) => rule.id,
);
const config = {
  compilerOptions: {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "Bundler",
    strict: true,
    noEmit: true,
    incremental: true,
    jsx: "preserve",
    allowJs: true,
    types: [],
    lib: ["ES2022", "DOM"],
    skipLibCheck: true,
    paths: { "~/*": ["./src/*"], "local/*": ["./src/lib/*"] },
  },
  include: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs",
    "**/*.mts",
    "**/*.cts",
  ],
};
const support = {
  "tsconfig.json": JSON.stringify(config),
  "src/examples/types.d.ts": `
    declare namespace JSX { interface IntrinsicElements { [tag: string]: any } }
    declare function require(name: string): any;
    declare module "react" { export function useState(value: number): number; }
    declare module "lucide-solid" { export function Icon(): void; }
    declare module "@ark-ui/solid" { export const Button: string; }
    declare module "@tanstack/solid-query" { export function useQuery(): void; }
    declare module "@internationalized/date" { export function parseDate(value: string): string; }
  `,
  "src/lib/kernel/unit.ts": "export const unit = 1;",
  "src/lib/kernel/result.ts": `
    export class Ok<T> { readonly kind = "ok"; constructor(readonly value: T) {} }
    export class Err<E> { readonly kind = "err"; constructor(readonly error: E) {} }
    export type Result<T, E> = Ok<T> | Err<E>;
    export const ok = <T>(value: T): Ok<T> => new Ok(value);
  `,
  "src/lib/http/port.ts":
    "export interface HttpClient { get(url: string): Promise<string>; }",
  "src/lib/http/fetch-client.ts":
    "export function createFetchClient() { return { mode: 'fetch' }; }",
  "src/lib/http/index.ts":
    "export { createFetchClient } from './fetch-client';",
  "src/lib/services/example.ts": "export function read() { return 'data'; }",
};
async function put(root: string, files: Record<string, string>) {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), text);
  }
}
async function fixture(files: Record<string, string> = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "flover-architecture-"));
  temporary.push(root);
  await put(root, { ...support, ...files });
  return root;
}
function git(root: string, ...args: string[]) {
  return execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function commit(root: string) {
  git(root, "add", ".");
  git(
    root,
    "-c",
    "user.name=Architecture Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-qm",
    "fixture",
  );
}
function startGit(root: string) {
  git(root, "init", "-q");
  commit(root);
}
async function check(root: string, all = true) {
  const report = await checkArchitecture({ root, all });
  expect(report.diagnostics).toEqual([]);
  return report;
}
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("architecture detectors", () => {
  it("catches a deliberate violation of every mechanical rule, with source evidence", async () => {
    const controls: Record<string, [string, string]> = {
      S1: [
        "src/lib/services/framework.ts",
        "import { useState } from 'react'; export const value = useState(1);",
      ],
      S2: [
        "src/lib/services/alias.ts",
        "export { unit } from '~/lib/kernel/unit';",
      ],
      S3: ["src/examples/icons.ts", "export { Icon } from 'lucide-solid';"],
      S4: [
        "src/components/patterns/domain.ts",
        "export { read } from '../../lib/services/example';",
      ],
      S5: [
        "src/examples/adapter.ts",
        "import { createFetchClient as make } from '../lib/http'; export const client = make();",
      ],
      S6: [
        "src/examples/transport.ts",
        "import type { HttpClient } from '../lib/http/port'; export const read = (http: HttpClient) => http.get('/api/data');",
      ],
      E1: [
        "src/examples/action.ts",
        "'use server'; import { ok } from '../lib/kernel/result'; export async function action() { return ok(1); }",
      ],
      A1: [
        "src/examples/page.tsx",
        "export const Page = () => <main suppressHydrationWarning />;",
      ],
    };
    // Adding a mechanical rule without a failing input must fail this suite.
    expect(Object.keys(controls).sort()).toEqual([...mechanical].sort());
    const report = await check(
      await fixture(Object.fromEntries(Object.values(controls))),
    );
    expect(exitCode(report)).toBe(1);
    for (const [id, [file]] of Object.entries(controls)) {
      expect(report.findings).toContainEqual(
        expect.objectContaining({
          rule: id,
          file,
          line: 1,
          evidence: expect.any(String),
        }),
      );
      expect(report.checks).toContainEqual(
        expect.objectContaining({ id, status: "violation" }),
      );
    }
  });

  it("allows each boundary's legitimate counterpart without mistaking strings or Map.get for transport", async () => {
    const root = await fixture({
      "src/lib/services/local.ts":
        "import { unit } from '../kernel/unit'; export const value = unit;",
      "src/lib/services/transport.ts":
        "import type { HttpClient } from '../http/port'; export const read = (http: HttpClient) => http.get('/api/data');",
      "src/lib/http/request.ts":
        "export const send = () => fetch('/api/data');",
      "src/lib/root/index.ts":
        "import { createFetchClient } from '../http'; export const makeRoot = () => createFetchClient();",
      "src/components/utility/icon/icon.ts":
        "export { Icon } from 'lucide-solid';",
      "src/components/forms/button.ts":
        "export { Button } from '@ark-ui/solid';",
      "src/components/chrome/segmented.tsx":
        "export { Button } from '@ark-ui/solid';",
      "src/components/forms/date-picker/date.ts":
        "export { parseDate } from '@internationalized/date';",
      "src/lib/query/index.ts":
        "export { useQuery } from '@tanstack/solid-query';",
      "src/lib/runtime/store.ts": "export const theme = 'dark';",
      "src/components/chrome/theme.ts":
        "export { theme } from '../../lib/runtime/store';",
      "src/components/patterns/unit.ts":
        "export { unit } from '../../lib/kernel/unit';",
      "src/examples/action.ts": `
        'use server'; import { ok } from '../lib/kernel/result';
        function local() { return ok(1); }
        export async function action() { return { status: 'ok' as const, value: local().value }; }
      `,
      "src/entry-server.tsx":
        "export const Layout = () => <html suppressHydrationWarning />;",
      "src/examples/page.tsx": `
        // import { Icon } from 'lucide-solid';
        const example = "import { useQuery } from '@tanstack/solid-query'";
        const values = new Map([['/api/data', example]]);
        export const Page = () => <a href='/api/data'>{values.get('/api/data')}</a>;
      `,
      "src/examples/ignored.test.ts": "import 'not-a-real-package';",
    });
    const report = await check(root);
    expect(report.findings).toEqual([]);
    expect(report.checks.every((item) => item.status === "verified")).toBe(
      true,
    );
    expect(report.status).toBe("review_pending");
    expect(report.review.every((item) => item.status === "needs_review")).toBe(
      true,
    );
    expect(report.exceptions.applied).toHaveLength(1);
    expect(report.exceptions.unused).toEqual([]);
    expect(exitCode(report)).toBe(0);
  });

  it("parses import forms and resolves other local aliases, native fetch aliases, and literal JSX spreads", async () => {
    const report = await check(
      await fixture({
        "src/examples/require.ts":
          "export const icon = require('lucide-solid');",
        "src/examples/dynamic.ts":
          "export const icons = () => import(`lucide-solid`);",
        "src/examples/import-type.ts":
          "export type Icon = typeof import('lucide-solid').Icon;",
        "src/lib/services/local-alias.ts":
          "export { unit } from 'local/kernel/unit';",
        "src/lib/kernel/directive.ts": "'use client'; export const value = 1;",
        "src/examples/fetch.ts":
          "const request = fetch; export const load = () => request('/api/data');",
        "src/examples/spread.tsx":
          "export const Page = () => <div {...{ suppressHydrationWarning: true }} />;",
        "src/examples/shadow.ts":
          "function require(name: string) { return name; } export const value = require('lucide-solid');",
        "src/lib/http/memory-client.ts":
          "export const createMemoryClient = () => ({});",
        "src/examples/memory.ts":
          "import { createMemoryClient } from '../lib/http/memory-client'; export const client = createMemoryClient();",
      }),
    );
    for (const file of [
      "src/examples/require.ts",
      "src/examples/dynamic.ts",
      "src/examples/import-type.ts",
    ]) {
      expect(report.findings).toContainEqual(
        expect.objectContaining({ rule: "S3", file }),
      );
    }
    for (const [rule, file] of [
      ["S2", "src/lib/services/local-alias.ts"],
      ["S1", "src/lib/kernel/directive.ts"],
      ["S6", "src/examples/fetch.ts"],
      ["A1", "src/examples/spread.tsx"],
    ]) {
      expect(report.findings).toContainEqual(
        expect.objectContaining({ rule, file }),
      );
    }
    expect(
      report.findings.some((item) => item.file === "src/examples/shadow.ts"),
    ).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ rule: "S5", file: "src/examples/memory.ts" }),
    );
  });

  it("catches aliased, nested, inline, and re-exported Result returns and exposes type-erased review gaps", async () => {
    const report = await check(
      await fixture({
        "src/examples/alias.ts":
          "'use server'; import type { Result as Outcome } from '../lib/kernel/result'; import { ok } from '../lib/kernel/result'; export async function save(): Promise<Outcome<number, string>> { return ok(1); }",
        "src/examples/nested.ts":
          "'use server'; import { ok } from '../lib/kernel/result'; export async function save() { return { rows: [ok(1)] }; }",
        "src/examples/inline.ts":
          "import { ok } from '../lib/kernel/result'; export async function save() { 'use server'; return ok(1); }",
        "src/examples/helper.ts":
          "import { ok } from '../lib/kernel/result'; export async function helper() { return ok(1); }",
        "src/examples/reexport.ts":
          "'use server'; export { helper as save } from './helper';",
        "src/examples/erased.ts":
          "'use server'; export async function save(): Promise<unknown> { return {}; }",
      }),
    );
    expect(
      report.findings
        .filter((item) => item.rule === "E1")
        .map((item) => item.file)
        .sort(),
    ).toEqual([
      "src/examples/alias.ts",
      "src/examples/inline.ts",
      "src/examples/nested.ts",
      "src/examples/reexport.ts",
    ]);
    expect(report.leads).toContainEqual(
      expect.objectContaining({
        rule: "E2",
        file: "src/examples/erased.ts",
        message: expect.stringContaining("any/unknown"),
      }),
    );
  });

  it("provides a reusable-component catalog and contextual leads without automatic DRY verdicts", async () => {
    const shape =
      "<section><div><h2>Title</h2><p>Text</p></div><div><span>A</span><span>B</span><span>C</span></div></section>";
    const report = await check(
      await fixture({
        "src/components/forms/button.tsx":
          "export const Button = () => <button>Save</button>;",
        "src/components/forms/index.ts": "export { Button } from './button';",
        "src/examples/one.tsx": `export const One = () => ${shape};`,
        "src/examples/two.tsx": `export const Two = () => ${shape};`,
        "src/examples/controls.tsx":
          "export const Controls = () => <div><button>Save</button><input type='hidden' /></div>;",
        "src/examples/fallback.ts":
          "export function read() { try { return 1; } catch { return 0; } }",
        "src/examples/computed.ts":
          "export const load = (name: string) => import(name);",
      }),
    );
    expect(report.findings).toEqual([]);
    expect(report.catalog).toContainEqual({
      name: "Button",
      importFrom: "~/components/forms",
      declaration: "src/components/forms/button.tsx",
    });
    expect(report.leads).toContainEqual(
      expect.objectContaining({
        rule: "C1",
        file: "src/examples/controls.tsx",
        candidate: "Button",
      }),
    );
    expect(report.leads).toContainEqual(
      expect.objectContaining({
        rule: "C1",
        related: expect.objectContaining({ file: "src/examples/two.tsx" }),
      }),
    );
    expect(report.leads).toContainEqual(
      expect.objectContaining({ rule: "E2", file: "src/examples/fallback.ts" }),
    );
    expect(report.leads).toContainEqual(
      expect.objectContaining({ rule: "C2", file: "src/examples/computed.ts" }),
    );
    expect(report.status).toBe("review_pending");
  });
});

describe("honest coverage and registry", () => {
  it("refuses an empty inventory, invalid compiler configuration, and unreadable source links", async () => {
    const root = await fixture();
    await rm(path.join(root, "src/lib"), { recursive: true });
    await expect(inventory(root)).rejects.toThrow("No production sources");
    await put(root, {
      "src/examples/page.ts": "export const page = 1;",
      "tsconfig.json": "{",
    });
    await expect(checkArchitecture({ root, all: true })).rejects.toThrow();
    await symlink(
      path.join(root, "missing.ts"),
      path.join(root, "src/examples/link.ts"),
    );
    await expect(inventory(root)).rejects.toThrow("Source symlinks");
  });

  it("does not turn a type error into successful architecture verification", async () => {
    const report = await checkArchitecture({
      root: await fixture({
        "src/examples/bad.ts": "export const value: number = 'wrong';",
      }),
      all: true,
    });
    expect(report.status).toBe("incomplete");
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({ file: "src/examples/bad.ts", code: 2322 }),
    );
    expect(report.checks.every((item) => item.status === "not_checked")).toBe(
      true,
    );
    expect(exitCode(report)).toBe(2);
  });

  it("rejects registry drift, silent disables, and unexplained exceptions", () => {
    expect(() =>
      validateRules([...RULES, { ...RULES[0], id: "S99" }], POLICY, mechanical),
    ).toThrow("No detector implements S99");
    expect(() => validateRules(RULES.slice(1), POLICY, mechanical)).toThrow(
      "Detector S1 has no rule",
    );
    expect(() =>
      validateRules([...RULES, RULES[0]], POLICY, mechanical),
    ).toThrow("Duplicate rule");
    expect(() =>
      validateRules(
        [{ ...RULES[0], disabledReason: false }, ...RULES.slice(1)],
        POLICY,
        mechanical,
      ),
    ).toThrow("reason to be disabled");
    expect(() =>
      validateRules(
        [{ ...RULES[0], detect: "" }, ...RULES.slice(1)],
        POLICY,
        mechanical,
      ),
    ).toThrow("needs detect");
    expect(() =>
      validateRules(
        RULES,
        { ...POLICY, exceptions: [{ ...POLICY.exceptions[0], reason: "" }] },
        mechanical,
      ),
    ).toThrow("Exceptions need");
    expect(() =>
      validateRules(
        RULES,
        {
          ...POLICY,
          libraryOwners: [{ ...POLICY.libraryOwners[0], reason: "" }],
        },
        mechanical,
      ),
    ).toThrow("Library owners need");
  });

  it("reports explicitly disabled rules and unused exceptions as unchecked", async () => {
    const report = await checkArchitecture({
      root: await fixture(),
      all: true,
      rules: [
        {
          ...RULES[0],
          disabledReason: "Fixture exercises a declared opt-out.",
        },
        ...RULES.slice(1),
      ],
    });
    expect(report.checks[0]).toMatchObject({
      id: "S1",
      status: "not_checked",
      files: 0,
      reason: expect.stringContaining("opt-out"),
    });
    expect(report.exceptions.unused).toEqual(POLICY.exceptions);
  });
});

describe("scope and command contract", () => {
  it("includes staged, unstaged, and untracked files and distinguishes a clean diff", async () => {
    const root = await fixture({
      "src/examples/staged.ts": "export const value = 1;",
      "src/examples/unstaged.ts": "export const value = 1;",
    });
    startGit(root);
    const clean = await check(root, false);
    expect(clean.status).toBe("no_changes");
    expect(clean.scope.inspected).toBe(0);
    expect(clean.checks.every((item) => item.status === "not_checked")).toBe(
      true,
    );
    await put(root, { "src/examples/staged.ts": "export const value = 2;" });
    git(root, "add", "src/examples/staged.ts");
    await put(root, {
      "src/examples/unstaged.ts": "export const value = 2;",
      "src/examples/untracked.ts": "export const value = 3;",
    });
    // A staged change is still in scope when the working copy was restored.
    await put(root, { "src/examples/staged.ts": "export const value = 1;" });
    const report = await check(root, false);
    expect(report.scope.files).toEqual([
      "src/examples/staged.ts",
      "src/examples/unstaged.ts",
      "src/examples/untracked.ts",
    ]);
    expect(report.scope.expandedToAll).toBe(false);
    expect(report.scope.content).toBe("working_tree");
  });

  it("uses the merge base for committed branch changes and scopes a nested project correctly", async () => {
    const parent = await fixture();
    const root = path.join(parent, "nested");
    await put(root, support);
    startGit(parent);
    git(parent, "branch", "baseline");
    await put(root, { "src/examples/committed.ts": "export const value = 1;" });
    commit(parent);
    await put(root, { "src/examples/new.ts": "export const value = 2;" });
    await put(parent, { "src/examples/outside.ts": "export const value = 3;" });
    expect(changedFiles(root, "baseline")).toEqual([
      "src/examples/committed.ts",
      "src/examples/new.ts",
    ]);
    const report = await checkArchitecture({ root, base: "baseline" });
    expect(report.scope.files).toEqual([
      "src/examples/committed.ts",
      "src/examples/new.ts",
    ]);
  });

  it("checks affected callers through barrels when a helper's inferred return changes", async () => {
    const root = await fixture({
      "src/examples/helper.ts": "export async function helper() { return 1; }",
      "src/examples/barrel.ts": "export { helper } from './helper';",
      "src/examples/action.ts":
        "'use server'; import { helper } from './barrel'; export const save = helper;",
    });
    startGit(root);
    await put(root, {
      "src/examples/helper.ts":
        "import { ok } from '../lib/kernel/result'; export async function helper() { return ok(1); }",
    });
    const report = await check(root, false);
    expect(report.scope.affected).toEqual([
      "src/examples/action.ts",
      "src/examples/barrel.ts",
    ]);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ rule: "E1", file: "src/examples/action.ts" }),
    );
    expect(report.scope.context).toContain("src/lib/kernel/result.ts");
  });

  it("expands policy changes and deletions to all sources; CSS-only changes still require review", async () => {
    const root = await fixture();
    startGit(root);
    await put(root, { "styles/example.css": "button { color: red; }" });
    const styles = await check(root, false);
    expect(styles.scope.inspected).toBe(0);
    expect(styles.scope.reviewFiles).toEqual(["styles/example.css"]);
    expect(styles.status).toBe("review_pending");
    await put(root, { "tools/architecture/REVIEW.md": "Changed policy" });
    const policy = await check(root, false);
    expect(policy.scope.expandedToAll).toBe(true);
    expect(policy.scope.inspected).toBe(policy.scope.inventory);
    commit(root);
    await rm(path.join(root, "src/lib/services/example.ts"));
    const deletion = await check(root, false);
    expect(deletion.scope.deleted).toEqual(["src/lib/services/example.ts"]);
    expect(deletion.scope.expandedToAll).toBe(true);
  });

  it("rejects portable relative imports that reach outside a standalone project", async () => {
    const parent = await fixture();
    const root = path.join(parent, "nested");
    await put(root, {
      ...support,
      "src/lib/kernel/outside.ts":
        "export { unit } from '../../../../src/lib/kernel/unit';",
    });
    const report = await check(root);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        rule: "S2",
        file: "src/lib/kernel/outside.ts",
      }),
    );
  });

  it("inventories supported source extensions while excluding tests, declarations, and build output", async () => {
    const root = await fixture(
      Object.fromEntries(
        [
          "src/examples/file.js",
          "src/examples/file.jsx",
          "src/examples/file.mjs",
          "src/examples/file.mts",
          "src/examples/file.cjs",
          "src/examples/file.cts",
          "proxy.ts",
          "src/examples/skip.test.ts",
          "src/examples/skip.spec.tsx",
          "src/examples/skip.d.ts",
          "src/examples/build/file.ts",
          "src/examples/node_modules/file.ts",
        ].map((name) => [name, "export const value = 1;"]),
      ),
    );
    const files = (await inventory(root)).map((name) =>
      path.relative(root, name),
    );
    for (const name of [
      "src/examples/file.js",
      "src/examples/file.jsx",
      "src/examples/file.mjs",
      "src/examples/file.mts",
      "src/examples/file.cjs",
      "src/examples/file.cts",
      "proxy.ts",
    ])
      expect(files).toContain(name);
    expect(files.some((name) => /skip|build|node_modules/.test(name))).toBe(
      false,
    );
  });

  it("emits parseable JSON, returns distinct failure codes, and does not write into the project", async () => {
    const root = await fixture();
    async function snapshot(
      directory: string,
    ): Promise<Record<string, string>> {
      const result: Record<string, string> = {};
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) Object.assign(result, await snapshot(full));
        else result[path.relative(root, full)] = await readFile(full, "utf8");
      }
      return result;
    }
    const before = await snapshot(root);
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [cli, ...args], {
        cwd: root,
        encoding: "utf8",
      });
    const good = run("--all", "--json");
    expect(good.status).toBe(0);
    expect(JSON.parse(good.stdout).status).toBe("review_pending");
    expect(await snapshot(root)).toEqual(before);
    for (const args of [
      ["--no-such-flag", "--json"],
      ["--all", "--changed", "--json"],
      ["--base", "--json"],
      ["--changed", "--json"],
    ]) {
      const bad = run(...args);
      expect(bad.status).toBe(2);
      expect(JSON.parse(bad.stdout).status).toBe("incomplete");
    }
    await put(root, {
      "src/examples/violation.ts": "export { Icon } from 'lucide-solid';",
    });
    const violation = run("--all", "--json");
    expect(violation.status).toBe(1);
    expect(JSON.parse(violation.stdout).findings).toContainEqual(
      expect.objectContaining({ rule: "S3" }),
    );
  }, 20_000);

  it("reports absent bundle evidence as a skipped test in an actual Vitest run", async () => {
    const project = fileURLToPath(new URL("../../", import.meta.url));
    const root = await fixture({
      "bundle.test.ts": await readFile(
        path.join(project, "src/lib/kernel/bundle.test.ts"),
        "utf8",
      ),
      "src/lib/services/ledger/ledger.fixtures.ts": await readFile(
        path.join(project, "src/lib/services/ledger/ledger.fixtures.ts"),
        "utf8",
      ),
      "src/lib/services/session/session.fixtures.ts": await readFile(
        path.join(project, "src/lib/services/session/session.fixtures.ts"),
        "utf8",
      ),
      "vitest.config.mjs":
        "export default { test: { environment: 'node', include: ['bundle.test.ts'] } };",
    });
    await symlink(
      path.join(project, "node_modules"),
      path.join(root, "node_modules"),
      "dir",
    );
    const run = spawnSync(
      process.execPath,
      [
        path.join(project, "node_modules/vitest/vitest.mjs"),
        "run",
        "--root",
        root,
        "--config",
        path.join(root, "vitest.config.mjs"),
        "--reporter",
        "json",
        "--outputFile",
        path.join(root, "report.json"),
      ],
      { cwd: root, encoding: "utf8" },
    );
    expect(run.status, run.stderr || run.stdout).toBe(0);
    const report = JSON.parse(
      await readFile(path.join(root, "report.json"), "utf8"),
    );
    expect(report.numPassedTests).toBe(1);
    expect(report.numPendingTests).toBe(1);
    expect(report.testResults[0].assertionResults).toContainEqual(
      expect.objectContaining({
        title: "no client chunk contains a string only a fixture has",
        status: "skipped",
      }),
    );
  }, 20_000);
});
