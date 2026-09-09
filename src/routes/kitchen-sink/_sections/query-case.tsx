import { For, createSignal, onMount } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import {
  AppError, asFailure, canceled, conflict, notFound, rateLimited, retryDelay, timeout, unavailable,
} from "~/lib/kernel";
import { parsePlan } from "~/lib/chaos";
import { createRoot } from "~/lib/root";
import { beginInteraction } from "~/lib/runtime";
import { defaultItemQuery, itemsQuery } from "~/lib/query";
import { Case, Row } from "../_components/section";
import { routes } from "../_lib/demo";
import s from "../_components/sink.module.css";

/* The cache, under the same plans the harness above uses — because the retry
 * policy and the three states have to survive it, not just the direct call. */

const POLICY = [
  ["not_found", notFound("x")],
  ["conflict", conflict("x")],
  ["canceled", canceled("x")],
  ["unavailable", unavailable("x")],
  ["timeout", timeout("x")],
  ["rate_limited (server said 30s)", rateLimited("x", 30)],
] as const;

/** Every state renders the SAME element and varies only its class and text.
 *
 *  A `<Show>` whose branches emit different shapes is a hydration hazard: the
 *  server renders one branch, the client renders another, and the hydrator
 *  looks for an element that is not there. Keeping the shape fixed removes the
 *  failure by construction rather than by getting the branches to agree. */
function State(props: { tone: "quiet" | "value" | "fail"; children: string }) {
  return (
    <span class={props.tone === "fail" ? s.fail : props.tone === "quiet" ? s.unread : s.mono}>
      {props.children}
    </span>
  );
}

export function QueryCase() {
  /* ONE root per INTERACTION, built INSIDE the component.
   *
   * At module scope this ran at import time and, on a server, produced one set
   * of roots — and one interaction id — shared by every request. That is the
   * cross-request leak `lib/runtime/doc.ts` warns about, and it works perfectly
   * in development where one person loads pages one at a time.
   *
   * No signal is needed to hold it: Solid runs a component body once per
   * instance rather than on every render, so a plain `const` already has the
   * build-once property a hooks framework needs a lazy initialiser for. */
  const correlationId = beginInteraction();
  const plain = createRoot({ routes, correlationId });
  const forced = createRoot({
    routes,
    correlationId,
    chaos: parsePlan("chaos=GET /items=fail:forbidden"),
  });

  /* A cache is a browser thing. The server has no chance to resolve these, so
     it renders the placeholder and the client swaps after hydration — rather
     than the two disagreeing about which branch is live. */
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  const list = useQuery(() => itemsQuery(plain.client, "w1"));
  const optional = useQuery(() => defaultItemQuery(plain.client, "w1"));
  const broken = useQuery(() => ({
    ...itemsQuery(forced.client, "broken"),
    queryKey: ["example", "items", "broken"] as const,
    retry: false,
  }));

  const listState = () => {
    if (!mounted() || list.isPending) return { tone: "quiet", text: "Loading…" } as const;
    if (list.error) return { tone: "fail", text: asFailure(list.error).kind } as const;
    return { tone: "value", text: (list.data ?? []).map((i) => i.name).join(" · ") } as const;
  };

  const optionalState = () => {
    if (!mounted() || optional.isPending) return { tone: "quiet", text: "Loading…" } as const;
    if (optional.error) return { tone: "fail", text: asFailure(optional.error).kind } as const;
    return optional.data == null
      ? ({ tone: "quiet", text: "— looked and found nothing —" } as const)
      : ({ tone: "value", text: optional.data.name } as const);
  };

  const brokenState = () => {
    if (!mounted() || broken.isPending) return { tone: "quiet", text: "Loading…" } as const;
    return {
      tone: "fail",
      text: `${broken.error ? asFailure(broken.error).kind : "—"} — nobody looked`,
    } as const;
  };

  return (
    <>
      <Case title="Through the cache" note="four states, and null is a value rather than an error">
        <Row label="list">
          <State tone={listState().tone}>{listState().text}</State>
        </Row>
        <Row label="optional read">
          <State tone={optionalState().tone}>{optionalState().text}</State>
        </Row>
        <Row label="forced failure">
          <State tone={brokenState().tone}>{brokenState().text}</State>
        </Row>
        <Row label="interaction">
          <State tone="value">{correlationId}</State>
        </Row>

        <p class={s.caseNote}>
          The optional read resolves to <code>null</code> and never touches the error branch —{" "}
          <strong>looked and found nothing is a success</strong>. That is the whole reason the
          service tags the 404 it means: an untagged one would arrive here as a fault instead,
          which is the correct answer for a typo in an endpoint.
        </p>
      </Case>

      <Case title="Retry policy" note="the cache asks the error model rather than counting attempts">
        <For each={POLICY}>
          {([label, failure]) => {
            const delay = retryDelay(asFailure(new AppError(failure)), 0);
            return (
              <Row label={label}>
                <State tone={delay === null ? "quiet" : "value"}>
                  {delay === null ? "never retried" : `retry after ${delay}ms`}
                </State>
              </Row>
            );
          }}
        </For>
        <p class={s.caseNote}>
          A refusal is an <strong>answer</strong> — asking again and hoping for a different
          reply turns one wall into three. A cancellation is never retried because the caller
          asked for it. And a rate limit honours the server's own retry-after rather than a
          backoff curve, which is only possible because the split forbids a service folding
          that kind away. <strong>Nothing in this tier names a status code.</strong>
        </p>
      </Case>
    </>
  );
}
