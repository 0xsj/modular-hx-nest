import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
} from "solid-js";
import { Button } from "~/components/forms";
import { parsePlan } from "~/lib/chaos";
import type { Failure } from "~/lib/kernel";
import { asFailure, presenceOf } from "~/lib/kernel";
import { createRoot } from "~/lib/root";
import type { Item } from "~/lib/services/example";
import { listItems } from "~/lib/services/example";
import { Case, Row } from "../_components/section";
import s from "../_components/sink.module.css";
import { routes } from "../_lib/demo";

/* Chaos is not a component, so it gets a HARNESS rather than a specimen.
 *
 * The only thing worth showing is the thing you cannot show any other way: that
 * a screen's four states are all reachable on demand. Each button sets a plan,
 * the demo below re-runs through a wrapped client, and what renders is the real
 * path — the same `presenceOf` a screen would use. */

const SCENARIOS = [
  {
    label: "found",
    query: "",
    note: "no plan — the fixture answers",
  },
  {
    label: "empty",
    query: "chaos=GET /items=empty:list",
    note: "a SUCCESS carrying nothing",
  },
  {
    label: "slow",
    query: "chaos=GET /items=latency:1500",
    note: "the loading state, held open",
  },
  {
    label: "forbidden",
    query: "chaos=GET /items=fail:forbidden",
    note: "nobody looked",
  },
  {
    label: "rate limited",
    query: "chaos=GET /items=fail:rate_limited",
    note: "carries the server's retry-after",
  },
  {
    label: "hang",
    query: "chaos=GET /items=hang",
    note: "never settles — the stuck spinner",
  },
  {
    label: "flaky",
    query: "chaos=GET /items=fail:internal,p:0.5&chaosSeed=7",
    note: "seeded, so it replays",
  },
] as const;
type View =
  | {
      state: "loading";
    }
  | {
      state: "found";
      rows: Item[];
    }
  | {
      state: "empty";
    }
  | {
      state: "unmeasured";
      failure: Failure;
    };
export function ChaosCase() {
  const [scenario, setScenario] = createSignal<(typeof SCENARIOS)[number]>(
    SCENARIOS[0],
  );
  const [answer, setAnswer] = createSignal<{
    query: string;
    view: View;
  } | null>(null);
  const abort: {
    current: AbortController | null | null;
  } = {
    current: null,
  };

  /* Loading is DERIVED, not set: it is simply "no answer for the plan we are
     currently showing". That removes a synchronous setState from the effect,
     and it makes a stale answer from a superseded scenario unrenderable rather
     than merely unlikely. */
  const view = createMemo(() => {
    const _answerSnapshot = answer();
    return _answerSnapshot && _answerSnapshot.query === scenario().query
      ? _answerSnapshot.view
      : {
          state: "loading" as const,
        };
  });
  createEffect(
    on(
      () => [scenario()],
      () => {
        const cleanup = (() => {
          abort.current?.abort();
          const controller = new AbortController();
          abort.current = controller;
          const query = scenario().query;
          void (async () => {
            /* The root composes the plan in; `listItems` is an ordinary service call
           that knows nothing about any of it. */
            const root = createRoot({
              routes,
              chaos: parsePlan(query),
            });
            // The signal reaches the request, so `cancel` genuinely cancels it —
            // and a hung promise is released rather than leaked per click.
            const result = await listItems(root.clientFor("example"), "w1", {
              signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            const presence = presenceOf(
              result.map((r) => (r.length ? r : null)),
            );
            setAnswer({
              query,
              view:
                presence.state === "found"
                  ? {
                      state: "found",
                      rows: presence.value,
                    }
                  : presence.state === "empty"
                    ? {
                        state: "empty",
                      }
                    : {
                        state: "unmeasured",
                        failure: asFailure(presence.failure),
                      },
            });
          })();
          return () => controller.abort();
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const enabled = process.env.NODE_ENV !== "production";
  return (
    <>
      <Case
        title="Forcing a state"
        note="each button sets a plan and re-runs the same request"
      >
        {!enabled ? (
          <p class={s.disabledNote}>
            <strong>Chaos is a no-op in this build.</strong> The wrapper returns
            the client untouched when <code>NODE_ENV</code> is production — the
            guard is structural, not a default, so reaching a live user takes a
            deliberate edit rather than a mis-set flag. Run the dev server to
            use this.
          </p>
        ) : null}

        <div class={s.scenarios}>
          <For each={SCENARIOS}>
            {(sc) => (
              <Button
                size="sm"
                intent={sc === scenario() ? "primary" : "secondary"}
                onClick={() => setScenario(sc)}
                disabled={!enabled}
              >
                {sc.label}
              </Button>
            )}
          </For>
          <Button
            size="sm"
            intent="ghost"
            onClick={() => {
              abort.current?.abort();
              setAnswer(null);
            }}
            disabled={!enabled}
          >
            cancel
          </Button>
        </div>

        <div class={s.stage}>
          <div>
            <div class={s.stageState}>{view().state}</div>
            {view().state === "loading" ? (
              <p class={s.quiet} aria-busy="true">
                Loading…
              </p>
            ) : null}
            {view().state === "empty" ? (
              <p class={s.quiet}>No targets yet.</p>
            ) : null}
            {(() => {
              const _viewSnapshot = view();
              return _viewSnapshot.state === "unmeasured" ? (
                <p class={s.crit}>
                  {_viewSnapshot.failure.kind}
                  {_viewSnapshot.failure.kind === "rate_limited" &&
                  _viewSnapshot.failure.retryAfter
                    ? ` · retry after ${_viewSnapshot.failure.retryAfter}s`
                    : ""}
                  {" — "}
                  {_viewSnapshot.failure.message}
                </p>
              ) : null;
            })()}
            {(() => {
              const _viewSnapshot2 = view();
              return _viewSnapshot2.state === "found" ? (
                <div class={s.rows}>
                  <For each={_viewSnapshot2.rows}>
                    {(r) => <span>{r.name}</span>}
                  </For>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <Row label="plan">
          <code class={s.planLine}>
            {(() => {
              const _scenarioSnapshot = scenario();
              return _scenarioSnapshot.query
                ? `?${_scenarioSnapshot.query}`
                : "— none —";
            })()}
          </code>
        </Row>
        <p class={s.limits}>{scenario().note}</p>
      </Case>

      <Case
        title="A chaos plan is a link"
        note="so a broken state is something you can send somebody"
      >
        <p class={s.limits}>
          The plan lives in a query string, seeded, so a probabilistic run
          replays identically and a broken state is a URL rather than an
          instruction to edit a file. The parser is{" "}
          <strong>total and silent</strong>: a malformed plan is ignored rather
          than thrown, because an injector that can crash the page is
          indistinguishable from the bug being hunted.
        </p>
        <div class={s.rows}>
          <For each={SCENARIOS.filter((sc) => sc.query)}>
            {(sc) => <code class={s.planLine}>?{sc.query}</code>}
          </For>
        </div>
        <p class={s.limits}>
          <strong>hang is not a timeout.</strong> The wrapper sits above the
          transport, so nothing here can trip its time budget — hang is a
          promise that never settles, which is the stuck-spinner case. For the
          failure a real elapsed budget produces, ask for{" "}
          <code>fail:timeout</code> by name. It still honours cancellation:
          press <em>cancel</em> while hanging and the request resolves as{" "}
          <code>canceled</code>.
        </p>
      </Case>
    </>
  );
}
