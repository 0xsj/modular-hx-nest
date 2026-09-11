import { createMemo, For } from "solid-js";
import { Empty, Panel } from "~/components/display";
import { Alert, Skeleton } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { useBrowserRoot } from "~/lib/app/browser-root";
import { asFailure, isRetryable } from "~/lib/kernel";
import { useRevokeSession, useSessions } from "~/lib/query";
import s from "./other-devices.module.css";

/* The one read in this application that happens in the browser, and therefore
 * the only caller `lib/query` has.
 *
 * # Its transport is the real fetch adapter, pointed at this origin
 *
 * The session cookie is HttpOnly, so the browser cannot hold a bearer and does
 * not call the API. It calls this application's own route handler, which speaks
 * the same problem document the adapter decodes — so what arrives here is the
 * same `Failure` the server had, and nothing below the transport knows which
 * side answered.
 *
 * `globalThis.location` rather than a `typeof window` branch: the base url is
 * only read inside a request, and a query never runs during a server render, so
 * the empty string on the server is never used and nothing about it reaches the
 * DOM.
 *
 * One root, memoised — a root per render would be a correlation id per render,
 * which is a second request id with extra steps.
 *
 * # The read and the write have separate failure surfaces
 *
 * Collapsing them into one banner tells a reader the list is unavailable while
 * they are looking at it. A failed revoke is about one row and one action; a
 * failed load is about the panel. */
export function OtherDevices() {
  const client = useBrowserRoot().clientFor("session");
  const query = useSessions(client);
  const revoke = useRevokeSession(client);

  /* `asFailure` is total: whatever the cache rejected with becomes the value
     the rest of the system speaks, so one exhaustive branch serves this screen
     and the server-rendered one beside it. */
  const failure = createMemo(() =>
    query.error ? asFailure(query.error) : null,
  );
  /* The write's own failure is separate from the read's. Collapsing them into
     one banner means a failed revoke reads as a failed load, and the reader is
     told the list is unavailable while looking at it. */
  const writeFailure = createMemo(() =>
    revoke.error ? asFailure(revoke.error) : null,
  );
  const others = createMemo(
    () => query.data?.filter((session) => !session.current) ?? [],
  );
  return (
    <Panel title="Other sessions">
      {query.isPending ? (
        <Flex direction="column" gap={4}>
          <Skeleton height="16px" />
          <Skeleton height="16px" width="70%" />
        </Flex>
      ) : (
        (() => {
          const _failureSnapshot = failure();
          return (() => {
            const _othersValue = others(),
              _writeFailureValue = writeFailure();
            return _failureSnapshot ? (
              <Alert tone="warn" title={_failureSnapshot.message}>
                <Flex direction="column" gap={4}>
                  <span class={s.meta}>
                    Nobody looked — this is not the same as finding nothing.
                    {_failureSnapshot.correlationId
                      ? ` Reference ${_failureSnapshot.correlationId}.`
                      : null}
                  </span>
                  {/* The kernel decides whether trying again is meaningful. A refusal
                is an ANSWER, and offering a retry for one is a control that
                cannot change anything. */}
                  {isRetryable(_failureSnapshot) ? (
                    <div>
                      <Button size="sm" onClick={() => void query.refetch()}>
                        Try again
                      </Button>
                    </div>
                  ) : null}
                </Flex>
              </Alert>
            ) : _othersValue.length === 0 ? (
              <Empty
                title="Only this one"
                body="You are not signed in anywhere else."
              />
            ) : (
              <Flex direction="column" gap={5}>
                {_writeFailureValue ? (
                  <Alert tone="crit" title={_writeFailureValue.message}>
                    <span class={s.meta}>
                      {_writeFailureValue.kind === "conflict"
                        ? "Use Sign out in the account menu for this one."
                        : "The list has been put back the way it was."}
                      {_writeFailureValue.correlationId
                        ? ` Reference ${_writeFailureValue.correlationId}.`
                        : null}
                    </span>
                  </Alert>
                ) : null}

                <ul class={s.list}>
                  <For each={_othersValue}>
                    {(session) => (
                      <li class={s.item}>
                        <span class={s.id}>{session.id}</span>
                        <span class={s.meta}>
                          since {new Date(session.createdAt).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          intent="ghost"
                          loading={
                            revoke.isPending && revoke.variables === session.id
                          }
                          onClick={() => revoke.mutate(session.id)}
                        >
                          Sign out
                        </Button>
                      </li>
                    )}
                  </For>
                </ul>
              </Flex>
            );
          })();
        })()
      )}
    </Panel>
  );
}
