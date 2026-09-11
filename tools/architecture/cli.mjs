import { checkArchitecture, exitCode, formatReport } from "./check.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
try {
  let all = false,
    changed = false,
    base;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--all") all = true;
    else if (arg === "--changed") changed = true;
    else if (arg === "--json") continue;
    else if (arg === "--base") {
      base = args[++index];
      if (!base || base.startsWith("-"))
        throw new Error("--base requires a Git ref");
    } else if (arg === "--help") {
      console.log(
        "Usage: npm run check:architecture -- [--changed | --all] [--base <ref>] [--json]\nDefault: staged, unstaged, and untracked production changes against HEAD.\n--base uses the merge base with the supplied ref. --all needs no Git repository.\nExit 0: no mechanical violation; 1: violations; 2: incomplete verification.\nContextual review is separate: tools/architecture/REVIEW.md.",
      );
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (all && (changed || base))
    throw new Error("--all cannot be combined with --changed or --base");
  const report = await checkArchitecture({ all, base });
  console.log(json ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exitCode = exitCode(report);
} catch (error) {
  const failure = { version: 1, status: "incomplete", message: error.message };
  console.log(
    json ? JSON.stringify(failure) : `NOT_CHECKED — ${failure.message}`,
  );
  process.exitCode = 2;
}
