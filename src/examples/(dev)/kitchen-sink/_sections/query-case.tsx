import { createEffect, createMemo, on, onCleanup } from "solid-js";
import { parsePlan } from "~/lib/chaos";
import { asFailure, err, ok, presenceOf } from "~/lib/kernel";
import { createQuery, defaultItemQuery, itemsQuery } from "~/lib/query";
import type { Root } from "~/lib/root";
import { createRoot } from "~/lib/root";
import { beginInteraction } from "~/lib/runtime";
import { useInteraction } from "~/lib/runtime/hooks";
import type { Item } from "~/lib/services/example";
import { Case, Row } from "../_components/section";
import s from "../_components/sink.module.css";
import { routes } from "../_lib/demo";
type Roots = {
  correlationId: string;
  plain: Root;
  broken: Root;
};
export function QueryCase() {
  /* An interaction begins ON MOUNT, never during render.
   *
   * Minting it in a `useState` initialiser was wrong twice: the server and the
   * client each ran it and produced different ids — a hydration mismatch — and
   * writing to a store during render is a side effect React may run twice.
   *
   * The store IS the external system here, so this SUBSCRIBES to it rather than
   * mirroring it into local state. The effect only tells the store to start;
   * nothing sets state inside it. On the server the store's snapshot is empty,
   * because nobody has clicked anything there. */
  const correlationId = useInteraction();
  createEffect(
    on(
      () => [correlationId()],
      () => {
        const cleanup = (() => {
          if (!correlationId()) beginInteraction();
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const roots = createMemo<Roots | null>(() =>
    correlationId()
      ? {
          correlationId: correlationId(),
          plain: createRoot({
            routes,
            correlationId: correlationId(),
          }),
          broken: createRoot({
            routes,
            correlationId: correlationId(),
            chaos: parsePlan("chaos=GET /items=fail:forbidden"),
          }),
        }
      : null,
  );
  return (
    <Case
      title="Through the cache"
      note="four states, and null is a value rather than an error"
    >
      {(() => {
        const _rootsSnapshot = roots();
        return (
          <>
            {_rootsSnapshot ? (
              <Reads roots={_rootsSnapshot} />
            ) : (
              <p class={s.quiet}>Starting an interaction…</p>
            )}
          </>
        );
      })()}

      <p class={s.limits}>
        <strong>All three reads name one interaction.</strong> An interaction is
        a user action — not a request, and not a component lifetime — so the id
        is minted once and handed to every root. Every failure these reads
        produce carries it, which is what makes{" "}
        <em>what else happened when they did this</em> answerable. It begins on
        mount rather than during render: the server has no interaction, and
        minting one there would be a different id on each side of hydration.
      </p>

      <p class={s.limits}>
        The cache hands every query an <code>AbortSignal</code> and aborts it
        when the query stops being wanted — an unmount, a key change, a refetch
        that supersedes. It is threaded into the service and down to the port,
        which is what makes <code>canceled</code> reachable at all.
      </p>
    </Case>
  );
}

/** The reads belong to the interaction, so they do not exist before it does. */
function Reads(props: { roots: Roots }) {
  const list = createQuery(() =>
    itemsQuery(props.roots.plain.clientFor("example"), "w1"),
  );
  const empty = createQuery(() =>
    defaultItemQuery(props.roots.plain.clientFor("example"), "w1"),
  );
  const broken = createQuery(() => ({
    ...itemsQuery(props.roots.broken.clientFor("example"), "broken"),
    queryKey: ["example", "items", "broken"] as const,
    retry: false,
  }));
  return (
    <>
      <Row label="list">
        {list.isPending ? (
          <span class={s.quiet}>Loading…</span>
        ) : list.error ? (
          <span class={s.crit}>{asFailure(list.error).kind}</span>
        ) : (
          <span class={s.row}>{list.data.map((i) => i.name).join(" · ")}</span>
        )}
      </Row>

      <Row label="optional read">
        {empty.isPending ? (
          <span class={s.quiet}>Loading…</span>
        ) : (
          <span class={s.quiet}>
            {
              presenceOf(
                empty.error
                  ? err<Item | null>(asFailure(empty.error))
                  : ok<Item | null>(empty.data),
              ).state
            }
          </span>
        )}
      </Row>

      <Row label="under chaos">
        {broken.isPending ? (
          <span class={s.quiet}>Loading…</span>
        ) : broken.error ? (
          <span class={s.crit}>{asFailure(broken.error).kind}</span>
        ) : (
          <span class={s.row}>{broken.data.length} items</span>
        )}
      </Row>

      <Row label="interaction">
        <code class={s.planLine}>{props.roots.correlationId}</code>
      </Row>
    </>
  );
}
