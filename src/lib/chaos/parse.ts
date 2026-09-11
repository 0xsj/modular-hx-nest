import { isFailureKind } from "../kernel";
import type { Effect, Plan } from "./plan";

/* A plan in a query string, so a broken state is a LINK.
 *
 *   ?chaos=fail:forbidden                       everything, forbidden
 *   ?chaos=GET /targets=empty:list              one route, empty collection
 *   ?chaos=GET /targets=fail:not_found,p:0.3;POST /targets=latency:2000
 *   ?chaos=...&chaosSeed=7                      replay a probabilistic run
 *
 *   plan    := rule (";" rule)*
 *   rule    := [pattern "="] effect ("," effect)*
 *   effect  := fail:<kind> | empty[:null|list] | latency:<ms> | hang | p:<0..1>
 *
 * "Send me the link that shows it" is the whole reason this exists. A plan
 * configured in code reproduces a state for the person who edited the file. */

function effectOf(parts: string[]): Effect | null {
  const effect: Effect = {};
  for (const raw of parts) {
    const [name, value] = raw.trim().split(":");
    switch (name) {
      case "fail":
        if (!isFailureKind(value)) return null;
        effect.fail = value;
        break;
      case "empty":
        effect.empty = value === "list" ? "list" : "null";
        break;
      case "latency": {
        const ms = Number(value);
        if (!Number.isFinite(ms) || ms < 0) return null;
        effect.latency = ms;
        break;
      }
      case "hang":
        effect.hang = true;
        break;
      case "p": {
        const p = Number(value);
        if (!Number.isFinite(p) || p < 0 || p > 1) return null;
        effect.p = p;
        break;
      }
      default:
        return null;
    }
  }
  return Object.keys(effect).length ? effect : null;
}

/** Returns undefined for an absent or unparseable plan.
 *
 *  TOTAL and silent by design: a malformed `?chaos=` must never break the page
 *  it was pasted into. Chaos that can itself crash the app is indistinguishable
 *  from the bug you were hunting. */
export function parsePlan(search: string | URLSearchParams): Plan | undefined {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const raw = params.get("chaos");
  if (!raw) return undefined;

  const rules: Array<readonly [string, Effect]> = [];
  for (const chunk of raw.split(";")) {
    if (!chunk.trim()) continue;
    const eq = chunk.indexOf("=");
    const pattern = eq === -1 ? "*" : chunk.slice(0, eq).trim();
    const body = eq === -1 ? chunk : chunk.slice(eq + 1);
    const effect = effectOf(body.split(","));
    if (effect) rules.push([pattern || "*", effect] as const);
  }
  if (!rules.length) return undefined;

  const seed = Number(params.get("chaosSeed"));
  return {
    rules,
    seed: Number.isFinite(seed) && seed !== 0 ? seed : undefined,
  };
}
