import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
} from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { createMemoryDiagnostics, createTrace } from "~/lib/diagnostics";
import type { ResponseMode } from "~/lib/root/resilience";
import { readResponseExample } from "~/lib/root/resilience";
import { beginInteraction } from "~/lib/runtime";
import { createLatestRead } from "~/lib/runtime/latest-read";
import { observeStore } from "~/lib/runtime/observe";
import { DiagnosticTimeline } from "../_components/diagnostic-timeline";
import s from "./diagnostics.module.css";
const SCENARIOS: Array<{
  mode: ResponseMode;
  label: string;
}> = [
  {
    mode: "valid",
    label: "Successful read",
  },
  {
    mode: "malformed",
    label: "Malformed success",
  },
  {
    mode: "unavailable",
    label: "Transport failure",
  },
  {
    mode: "empty",
    label: "Empty result",
  },
  {
    mode: "held",
    label: "Hold response",
  },
];
export function DiagnosticsDemo() {
  const buffer = createMemoryDiagnostics({
    capacity: 120,
  });
  const reader = createLatestRead(
    (
      input: {
        mode: ResponseMode;
        recovery?: boolean;
      },
      signal,
    ) => {
      const trace = createTrace(buffer.port, {
        operation: input.recovery ? "items.recover" : "items.load",
        correlationId: beginInteraction(),
      });
      return trace.run(input.recovery ? "recovery" : "operation", () =>
        readResponseExample(input.mode, signal, trace),
      );
    },
  );
  const [cancelRequested, setCancelRequested] = createSignal(false);
  const state = observeStore(reader.subscribe, reader.get, reader.server);
  createEffect(
    on(
      () => [reader],
      () => {
        const cleanup = () => reader.cancel();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const pending = createMemo(() => state().state === "pending");
  const data = createMemo(() => {
    const _stateSnapshot = state();
    return _stateSnapshot.state === "ready"
      ? _stateSnapshot.value
      : _stateSnapshot.state === "idle"
        ? undefined
        : _stateSnapshot.previous;
  });
  const status = createMemo(() =>
    cancelRequested()
      ? "Request canceled. The last settled view is retained."
      : (() => {
          const _stateSnapshot2 = state();
          return _stateSnapshot2.state === "pending"
            ? "Request in progress. A held response waits until you cancel it."
            : _stateSnapshot2.state === "failed"
              ? `Read failed: ${_stateSnapshot2.failure.kind}. ${data() === undefined ? "No data has been accepted." : "Previous data remains visible and may be stale."}`
              : _stateSnapshot2.state === "ready"
                ? "Read completed. Inspect the request and decode steps below."
                : "Choose a scenario to begin recording.";
        })(),
  );
  function run(mode: ResponseMode, recovery = false) {
    setCancelRequested(false);
    void reader.run({
      mode,
      recovery,
    });
  }
  return (
    <Flex direction="column" gap={7}>
      <Alert tone="info" title="An isolated, visit-local inspector">
        These sample reads use the real service and response decoder over memory
        fixtures. The recorder receives classifications and timing; request
        contents and failure messages stay out of the timeline.
      </Alert>
      <Card aria-labelledby="diagnostic-read-title">
        <CardHeader
          actions={
            <Badge
              tone={
                pending()
                  ? "accent"
                  : state().state === "failed"
                    ? "warn"
                    : "neutral"
              }
            >
              {pending()
                ? "In progress"
                : state().state === "failed"
                  ? "Read failed"
                  : "Sample data"}
            </Badge>
          }
        >
          <CardTitle id="diagnostic-read-title" level={2}>
            Drive the request
          </CardTitle>
          <CardDescription>
            A malformed success produces a successful request span followed by a
            failed decode span.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap={5}>
            {(() => {
              const _stateSnapshot3 = state();
              return _stateSnapshot3.state === "failed" ? (
                <Alert tone="warn" title="This region could not be refreshed">
                  {_stateSnapshot3.failure.message}
                </Alert>
              ) : null;
            })()}
            <div aria-busy={pending()}>
              {(() => {
                const _dataSnapshot = data();
                return _dataSnapshot === undefined ? (
                  <Text tone="muted">No successful read yet.</Text>
                ) : _dataSnapshot.length === 0 ? (
                  <Text>The request succeeded. No items were found.</Text>
                ) : (
                  <div class={s.items}>
                    <For each={_dataSnapshot}>
                      {(item) => (
                        <div class={s.item}>
                          <Text weight="medium">{item.name}</Text>
                          <Text size="sm" tone="muted">
                            {item.host}
                          </Text>
                        </div>
                      )}
                    </For>
                  </div>
                );
              })()}
            </div>
            <Text size="sm" role="status" aria-atomic="true">
              {status()}
            </Text>
          </Flex>
        </CardBody>
        <CardFooter>
          <Flex gap={3} wrap>
            <For each={SCENARIOS}>
              {({ mode, label }) => (
                <Button
                  size="sm"
                  disabled={pending()}
                  onClick={() => run(mode)}
                >
                  {label}
                </Button>
              )}
            </For>
            <Button
              size="sm"
              disabled={!pending()}
              onClick={() => {
                reader.cancel();
                setCancelRequested(true);
              }}
            >
              Cancel request
            </Button>
            <Button
              size="sm"
              intent="primary"
              disabled={
                pending() || (state().state !== "failed" && !cancelRequested())
              }
              onClick={() => run("valid", true)}
            >
              Recover read
            </Button>
          </Flex>
        </CardFooter>
      </Card>

      <DiagnosticTimeline buffer={buffer} pending={pending()} />
    </Flex>
  );
}
