import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const known = [
  "routes",
  "controls",
  "cards",
  "components",
  "items",
  "foundations",
  "workspaces",
  "expansions",
  "resilience",
];
const args = process.argv.slice(2);
let base = "http://127.0.0.1:4173",
  suites = known,
  dev = false;
for (let index = 0; index < args.length; index++) {
  const arg = args[index];
  if (arg === "--") continue;
  if (arg === "--dev") {
    dev = true;
    continue;
  }
  if (arg === "--base") base = args[++index];
  else if (arg === "--suite") suites = args[++index]?.split(",") ?? [];
  else
    throw new Error(
      `Unknown argument ${arg}. Use --base <url> and --suite <name[,name]>`,
    );
}
const address = new URL(base);
assert.ok(["http:", "https:"].includes(address.protocol));
base = base.replace(/\/$/, "");
assert.ok(
  suites.length && suites.every((s) => known.includes(s)),
  `Choose suites from ${known.join(", ")}`,
);
const root = fileURLToPath(new URL("../..", import.meta.url));
const output = path.join(
  root,
  "artifacts",
  "browser",
  new Date().toISOString().replaceAll(":", "-"),
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const report = {
  base,
  provenance:
    "Implementation-visible behavior regressions, not a blind oracle.",
  suites: [],
};
try {
  for (const name of suites) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
    });
    const page = await context.newPage(),
      errors = [];
    // Visible SSR content can precede hydration. Exercise enhanced interactions
    // once a document's JS has loaded; native form behavior has its own checks.
    const goto = page.goto.bind(page),
      reload = page.reload.bind(page);
    page.goto = (url, options = {}) =>
      goto(url, { waitUntil: "networkidle", ...options });
    page.reload = (options = {}) =>
      reload({ waitUntil: "networkidle", ...options });
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const artifact = (file) =>
      path.join(output, name + "-" + path.basename(file));
    const started = Date.now();
    try {
      await (
        await import(`./suites/${name}.mjs`)
      ).default({
        page,
        errors,
        base,
        artifact,
        dev,
        axePath: require.resolve("axe-core/axe.min.js"),
      });
      assert.deepEqual(errors, []);
      report.suites.push({
        name,
        status: "passed",
        milliseconds: Date.now() - started,
      });
      console.log(`PASS ${name}`);
    } catch (error) {
      await page
        .screenshot({ path: artifact("failure.png"), fullPage: true })
        .catch(() => {});
      await writeFile(
        artifact("failure.txt"),
        `${error.stack}\n\n${errors.join("\n")}\n\n${await page
          .locator("body")
          .innerText()
          .catch(() => "")}`,
      );
      report.suites.push({
        name,
        status: "failed",
        message: error.message,
        milliseconds: Date.now() - started,
      });
      console.error(`FAIL ${name}: ${error.message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(`Browser evidence: ${output}`);
process.exitCode = report.suites.some((s) => s.status === "failed") ? 1 : 0;
