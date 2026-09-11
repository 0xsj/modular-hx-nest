import { createMemo, createSignal, For } from "solid-js";
import {
  Badge,
  Empty,
  Panel,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "~/components/display";
import { Alert, Skeleton } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { useBrowserRoot } from "~/lib/app/browser-root";
import { asFailure, isRetryable } from "~/lib/kernel";
import { useActivity } from "~/lib/query";
import type { AuditEntry } from "~/lib/services/ledger";
import s from "./page.module.css";

/* An append-only log, a page at a time, over the cache.
 *
 * The read this template exists to demonstrate: cursor-paged, filterable,
 * legitimately empty, and carrying a correlation id per row — which is the
 * column that makes `decisions/0003` worth anything. Every entry here was
 * actually recorded by the fixture as a side effect of an operation somebody
 * performed, so signing in adds a row and revoking a session adds another.
 *
 * # There is no total, and that is deliberate
 *
 * Counting an append-only ledger is a full scan whose answer is stale before it
 * renders. `CLAUDE.md`: an unmeasured total renders as `–`, never as a number
 * nothing computed. So no "1–50 of 1,284", and no page numbers — the ledger
 * grows at the HEAD, so an offset would re-show rows that moved down and hide
 * the ones that took their place. */

const RELATIVE = (iso: string): string => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};
const TONE: Record<string, "accent" | "warn" | "crit" | undefined> = {
  system: "warn",
  account: "accent",
};
export function ActivityTable() {
  const client = useBrowserRoot().clientFor("ledger");
  const [facet, setFacet] = createSignal<string | undefined>();
  const [correlation, setCorrelation] = createSignal<string | undefined>();
  const query = useActivity(client, () => ({
    facet: facet(),
    correlation: correlation(),
  }));
  const pages = createMemo(() => query.data?.pages ?? []);
  const entries = createMemo(() => pages().flatMap((page) => page.entries));
  /* Page ONE only, and kept as the filter changes. The server sends facets with
     the first page because they describe the whole set — absent on later pages
     means "keep the ones you have", never "there are none". */
  const facets = createMemo(() => pages()[0]?.facets ?? []);
  const failure = createMemo(() =>
    query.error ? asFailure(query.error) : null,
  );
  return (
    <Panel title="Activity">
      <Flex direction="column" gap={6}>
        <Flex gap={3} wrap>
          <button
            type="button"
            class={s.chip}
            data-on={!facet() && !correlation() ? "" : undefined}
            onClick={() => {
              setFacet(undefined);
              setCorrelation(undefined);
            }}
          >
            everything
          </button>
          <For each={facets()}>
            {({ facet: name, total }) => (
              <button
                type="button"
                class={s.chip}
                data-on={facet() === name ? "" : undefined}
                onClick={() => {
                  setFacet(name);
                  setCorrelation(undefined);
                }}
              >
                {name}
                {/* AS GIVEN. Recomputing this from the visible rows would show
                  every other bucket as zero once a facet is entered, and remove
                  the way back out of it. */}
                <span class={s.count}>{total}</span>
              </button>
            )}
          </For>
          {(() => {
            const _correlationSnapshot = correlation();
            return _correlationSnapshot ? (
              <button
                type="button"
                class={s.chip}
                data-on
                onClick={() => setCorrelation(undefined)}
              >
                interaction {_correlationSnapshot.slice(0, 12)} ✕
              </button>
            ) : null;
          })()}
        </Flex>

        {query.isPending ? (
          <Flex direction="column" gap={4}>
            <For each={[0, 1, 2, 3, 4]}>
              {(_n) => <Skeleton height="18px" />}
            </For>
          </Flex>
        ) : (
          (() => {
            const _failureSnapshot = failure();
            return _failureSnapshot ? (
              <Alert tone="crit" title={_failureSnapshot.message}>
                <Flex direction="column" gap={4}>
                  <span class={s.meta}>
                    Nobody looked, which is not the same as finding nothing.
                    {_failureSnapshot.correlationId
                      ? ` Reference ${_failureSnapshot.correlationId}.`
                      : null}
                  </span>
                  {isRetryable(_failureSnapshot) ? (
                    <div>
                      <Button size="sm" onClick={() => void query.refetch()}>
                        Try again
                      </Button>
                    </div>
                  ) : null}
                </Flex>
              </Alert>
            ) : entries().length === 0 ? (
              <Empty
                title="Nothing here"
                body={
                  correlation()
                    ? "No other entry belongs to that interaction."
                    : facet()
                      ? `No ${facet()} activity yet.`
                      : "Nothing has happened on this account yet."
                }
              />
            ) : (
              <>
                <div class={s.scroll}>
                  <Table caption="Everything recorded on this account, newest first">
                    <THead>
                      <Tr>
                        <Th>when</Th>
                        <Th>action</Th>
                        <Th>subject</Th>
                        <Th>actor</Th>
                        <Th>scope</Th>
                        <Th>interaction</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      <For each={entries()}>
                        {(entry) => (
                          <Row
                            entry={entry}
                            onCorrelation={() => {
                              setCorrelation(entry.correlation_id);
                              setFacet(undefined);
                            }}
                          />
                        )}
                      </For>
                    </TBody>
                  </Table>
                </div>

                <Flex gap={5} align="center" wrap>
                  {/* The presence of a cursor is the whole answer. No count is kept
                  and none is needed. */}
                  {query.hasNextPage ? (
                    <Button
                      size="sm"
                      loading={query.isFetchingNextPage}
                      onClick={() => void query.fetchNextPage()}
                    >
                      Load more
                    </Button>
                  ) : (
                    <span class={s.meta}>That is the whole log.</span>
                  )}
                  <span class={s.meta}>
                    {entries().length} shown of{" "}
                    <span title="unmeasured">–</span> — no total is computed,
                    because counting an append-only log is a full scan whose
                    answer is stale before it renders.
                  </span>
                </Flex>
              </>
            );
          })()
        )}
      </Flex>
    </Panel>
  );
}
function Row(props: { entry: AuditEntry; onCorrelation: () => void }) {
  const detail = createMemo(() => Object.entries(props.entry.detail));
  return (
    <Tr>
      <Td>
        <span class={s.meta} title={props.entry.occurred_at}>
          {RELATIVE(props.entry.occurred_at)}
        </span>
      </Td>
      <Td>
        <span class={s.action}>{props.entry.action}</span>
        {(() => {
          const _detailSnapshot = detail();
          return _detailSnapshot.length ? (
            <div class={s.detail}>
              {_detailSnapshot
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join(" · ")}
            </div>
          ) : null;
        })()}
      </Td>
      <Td>
        <span class={s.mono}>{props.entry.subject}</span>
      </Td>
      <Td>
        {/* `anonymous` is a real value and means the request arrived
            unauthenticated. Rendered as words, never blank, and never the
            account it went on to create. */}
        {props.entry.actor === "anonymous" ? (
          <span class={s.anon}>not signed in</span>
        ) : (
          <span class={s.mono}>{props.entry.actor}</span>
        )}
      </Td>
      <Td>
        <Badge tone={TONE[props.entry.scope]}>{props.entry.scope}</Badge>
      </Td>
      <Td>
        <button
          type="button"
          class={s.corr}
          onClick={() => props.onCorrelation()}
          title="Everything else in this interaction"
        >
          {props.entry.correlation_id.slice(0, 12)}
        </button>
      </Td>
    </Tr>
  );
}
