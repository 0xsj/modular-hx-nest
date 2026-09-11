import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import type { getProbe } from "~/lib/app/route-data";
import type { Failure } from "~/lib/kernel";
import { assertNever } from "~/lib/kernel";
import s from "./probe.module.css";

/* A real screen, server-rendered, under a plan taken from the URL.
 *
 * The whole chain in one file: query string → plan → root → client → service →
 * three states. Nothing below the root knows chaos exists, and the service is
 * the same one-liner it would be in production. */

/** This screen's own fixtures. The shipped table is empty because a template has
 *  no domain; a caller with fixtures passes them in rather than editing the
 *  tier. Note it REFUSES as well as succeeding. */

const PLANS = [
  ["", "no plan — the fixtures answer"],
  ["?chaos=GET /items=empty:list", "looked and found nothing"],
  ["?chaos=GET /items=fail:forbidden", "nobody looked"],
  ["?chaos=GET /items=fail:rate_limited", "and it keeps the retry-after"],
  ["?chaos=GET /items=latency:2000", "a slow server render"],
  ["?workspace=locked", "the fixture's own refusal, no chaos involved"],
] as const;
export default function ProbePage(props: Awaited<ReturnType<typeof getProbe>>) {
  return (
    <main class={s.page}>
      <div class={s.inner}>
        <div>
          <h1 class={s.title}>Probe</h1>
          <p class={s.blurb}>
            One server-rendered screen, reading its chaos plan from the query
            string. The service below is a one-line call that knows nothing
            about any of it.
          </p>
        </div>

        {/* A surface under a plan must SAY so. A forced failure that looks real
            is an afternoon somebody spends chasing it. */}
        <div class={s.badges}>
          {props.root.fixtures ? (
            <span class={`${s.badge} ${s.fixture}`}>fixtures</span>
          ) : null}
          {props.root.underChaos ? (
            <span class={`${s.badge} ${s.chaos}`}>chaos</span>
          ) : null}
          <span class={`${s.badge} ${s.cid}`}>{props.root.correlationId}</span>
        </div>

        <div class={s.stage}>
          <span class={s.state}>{props.presence.state}</span>
          {props.presence.state === "found" ? (
            props.presence.value.map((t) => <span class={s.row}>{t.name}</span>)
          ) : props.presence.state === "empty" ? (
            <span class={s.quiet}>No targets yet.</span>
          ) : props.presence.state === "unmeasured" ? (
            <Problem failure={props.presence.failure} />
          ) : (
            assertNever(props.presence, "presence state")
          )}
        </div>

        <div class={s.links}>
          <For each={PLANS}>
            {([q, note]) => (
              <Link href={`/probe${q}`} class={s.link}>
                {q || "/probe"} <span class={s.meta}>— {note}</span>
              </Link>
            )}
          </For>
        </div>
      </div>
    </main>
  );
}
function Problem(props: { failure: Failure }) {
  return (
    <>
      <span class={s.crit}>
        {props.failure.kind}
        {props.failure.kind === "rate_limited" && props.failure.retryAfter
          ? ` · retry after ${props.failure.retryAfter}s`
          : ""}
        {" — "}
        {props.failure.message}
      </span>
      {/* The thread back to everything else this interaction did. */}
      <span class={s.meta}>
        correlation {props.failure.correlationId ?? "—"}
      </span>
    </>
  );
}
