// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

/* Fixture data must not reach the browser.
 *
 * `lib/query` imports a service barrel to get its query function, and a barrel
 * re-exports that domain's fixture routes. That is fine only while the fixture
 * module is tree-shakeable — and a module with a TOP-LEVEL side effect is not.
 * Seeding on import therefore shipped a whole audit log, seed rows and all, to
 * every visitor, and nothing said so: the build succeeded, the tests passed,
 * and the only symptom was a larger chunk.
 *
 * It is checked here rather than reasoned about because the failure is silent
 * and the cause is three imports away from the mistake.
 *
 * SKIPPED when there is no build to look at, and it says so rather than passing
 * — a check that quietly succeeds when it cannot run is worse than none. */

const CHUNKS = path.join(
  process.cwd(),
  ".output",
  "public",
  "_build",
  "assets",
);

/** Strings that exist only inside a fixture. If one is in a client chunk, the
 *  fixture is too. */
const FIXTURE_ONLY = [
  "system.fixture_seeded", // a ledger seed row
  "That email and password do not match", // the session fixture's refusal
  "That is the session you are using", // the revoke conflict
];

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.name.endsWith(".js")) yield full;
  }
}

describe("no fixture reaches the browser bundle", () => {
  it("no client chunk contains a string only a fixture has", async (context) => {
    const chunks: string[] = [];
    for await (const file of walk(CHUNKS)) chunks.push(file);

    if (chunks.length === 0) {
      /* The null result is a result: say it was not run rather than report a
         pass nobody earned. */
      context.skip(
        "no build found at .output/public/_build/assets — run `npm run build` first",
      );
    }

    const offenders: string[] = [];
    for (const file of chunks) {
      const text = await readFile(file, "utf8");
      for (const needle of FIXTURE_ONLY) {
        if (text.includes(needle)) {
          offenders.push(`${path.relative(process.cwd(), file)} — "${needle}"`);
        }
      }
    }

    expect(
      offenders,
      "a fixture module with a top-level side effect cannot be tree-shaken; seed lazily",
    ).toEqual([]);
  });

  it("the needles are real — each one exists in a fixture", async () => {
    // Otherwise this checks for strings nothing ever contained.
    const sources = await Promise.all([
      readFile(
        path.join(process.cwd(), "src/lib/services/ledger/ledger.fixtures.ts"),
        "utf8",
      ),
      readFile(
        path.join(
          process.cwd(),
          "src/lib/services/session/session.fixtures.ts",
        ),
        "utf8",
      ),
    ]);
    const all = sources.join("\n");
    for (const needle of FIXTURE_ONLY) expect(all, needle).toContain(needle);
  });
});
