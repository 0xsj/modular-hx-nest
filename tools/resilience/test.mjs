import { spawnSync } from "node:child_process";
import { tests } from "./cases.mjs";
const run = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", ...tests],
  { stdio: "inherit" },
);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
