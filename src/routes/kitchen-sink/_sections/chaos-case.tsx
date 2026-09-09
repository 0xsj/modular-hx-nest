import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Button } from "~/components/forms";
import { asFailure, presenceOf, type Failure } from "~/lib/kernel";
import { parsePlan } from "~/lib/chaos";
import { createRoot } from "~/lib/root";
import { listItems, type Item } from "~/lib/services/example";
import { Case, Row } from "../_components/section";
import { routes } from "../_lib/demo";
import s from "../_components/sink.module.css";

/* Chaos is not a component, so it gets a HARNESS rather than a specimen.
 *
 * The only thing worth showing is the thing you cannot show any other way: that
 * a screen's four states are all reachable on demand. Each button sets a plan,
 * the demo re-runs through a wrapped client, and what renders is the real path
 * — the same `presenceOf` a screen would use. */

const SCENARIOS = [
  { label: "found", query: "", note: "no plan — the fixture answers" },
  { label: "empty", query: "chaos=GET /items=empty:list", note: "a SUCCESS carrying nothing" },
  { label: "slow", query: "chaos=GET /items=latency:1500", note: "the loading state, held open" },
  { label: "forbidden", query: "chaos=GET /items=fail:forbidden", note: "nobody looked" },
  { label: "rate limited", query: "chaos=GET /items=fail:rate_limited", note: "carries a retry-after" },
  { label: "hang", query: "chaos=GET /items=hang", note: "never settles — the stuck spinner" },
  { label: "flaky", query: "chaos=GET /items=fail:internal,p:0.5&chaosSeed=7", note: "seeded, so it replays" },
] as const;

type View =
  | { state: "loading" }
  | { state: "found"; rows: Item[] }
  | { state: "empty" }
  | { state: "unmeasured"; failure: Failure };

export function ChaosCase() {
  const [scenario, setScenario] = createSignal<(typeof SCENARIOS)[number]>(SCENARIOS[0]);
  const [answer, setAnswer] = createSignal<{ query: string; view: View } | null>(null);

  /* Loading is DERIVED, not set: it is simply "no answer for the plan we are
     currently showing". That makes a stale answer from a superseded scenario
     unrenderable rather than merely unlikely. */
  const view = (): View => {
    const a = answer();
    return a && a.query === scenario().query ? a.view : { state: "loading" };
  };

  createEffect(() => {
    const query = scenario().query;
    const controller = new AbortController();
    onCleanup(() => controller.abort());

    void (async () => {
      /* The root composes the plan in; `listItems` is an ordinary service call
         that knows nothing about any of it. */
      const root = createRoot({ routes, chaos: parsePlan(query) });
      /* The signal reaches the request, so switching scenarios genuinely
         cancels — and a hung promise is released rather than leaked per click. */
      const result = await listItems(root.client, "w1", { signal: controller.signal });
      if (controller.signal.aborted) return;
      const presence = presenceOf(result.map((rows) => (rows.length ? rows : null)));
      setAnswer({
        query,
        view:
          presence.state === "unmeasured"
            ? { state: "unmeasured", failure: presence.failure }
            : presence.state === "empty"
              ? { state: "empty" }
              : { state: "found", rows: presence.value },
      });
    })();
  });

  return (
    <Case title="Forcing the states nobody looks at" note="a plan is a query string, so a broken state is a link">
      <Row label="scenario">
        <For each={SCENARIOS}>
          {(sc) => (
            <Button
              intent={scenario().label === sc.label ? "primary" : "secondary"}
              size="sm"
              onClick={() => setScenario(sc)}
            >
              {sc.label}
            </Button>
          )}
        </For>
      </Row>

      <Row label="plan">
        <code class={s.mono}>{scenario().query || "— none —"}</code>
      </Row>

      <Row label="renders">
        <Show when={view().state !== "loading"} fallback={<span class={s.unread}>Loading…</span>}>
          <Show when={view().state === "found"} fallback={
            <Show when={view().state === "empty"} fallback={
              <span class={s.fail}>
                {asFailure((view() as { failure: Failure }).failure).kind} — nobody looked
              </span>
            }>
              <span class={s.unread}>— looked and found nothing —</span>
            </Show>
          }>
            <span>{(view() as { rows: Item[] }).rows.map((i) => i.name).join(" · ")}</span>
          </Show>
        </Show>
      </Row>

      <p class={s.caseNote}>{scenario().note}</p>
      <p class={s.caseNote}>
        <strong>Forcing emptiness is the axis nobody asks for.</strong> In development a
        fixture always has data, so the empty branch of every screen ships unlooked-at —
        which is what makes <em>three states, not two</em> a rule the fixtures themselves
        hide. Chaos is <strong>not</strong> a fixture: a fixture reproduces what the server
        does, chaos forces what it could, and collapsing the two turns <em>a fixture must
        reproduce refusals</em> into <em>a fixture returns whatever is convenient</em>.
      </p>
      <p class={s.caseNote}>
        <code>hang</code> is not a timeout. Chaos wraps the client rather than living inside
        it, so nothing here trips the transport's own budget — it is the stuck spinner. It
        still honours cancellation, which is why switching scenarios releases it.
      </p>
    </Case>
  );
}
