import { createMemo, createSignal, For, mergeProps } from "solid-js";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "~/components/display";
import {
  Button,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import type { createMemoryDiagnostics } from "~/lib/diagnostics";
import { observeSource } from "~/lib/runtime/observe";
import s from "./diagnostic-timeline.module.css";

/** Cookbook composition shared by the inspector and the complete item feature. */
export function DiagnosticTimeline(incomingProps: {
  buffer: ReturnType<typeof createMemoryDiagnostics>;
  pending?: boolean;
}) {
  const props = mergeProps(
    {
      pending: false,
    } as const,
    incomingProps,
  );
  const [selected, setSelected] = createSignal("all");
  const snapshot = observeSource(() => props.buffer);
  const traces = createMemo(() => [
    ...new Map(
      snapshot().entries.map(({ event }) => [event.traceId, event]),
    ).values(),
  ]);
  const selection = createMemo(() =>
    traces().some((trace) => trace.traceId === selected()) ? selected() : "all",
  );
  const entries = createMemo(() =>
    snapshot().entries.filter((entry) => {
      const _selectionSnapshot = selection();
      return (
        _selectionSnapshot === "all" ||
        entry.event.traceId === _selectionSnapshot
      );
    }),
  );
  const activeTrace = createMemo(() =>
    traces().find((trace) => trace.traceId === selection()),
  );
  return (
    <Card aria-labelledby="timeline-title">
      <CardHeader
        actions={
          <Button
            size="sm"
            disabled={props.pending || snapshot().entries.length === 0}
            onClick={() => {
              props.buffer.clear();
              setSelected("all");
            }}
          >
            Clear timeline
          </Button>
        }
      >
        <CardTitle id="timeline-title" level={2}>
          Interaction timeline
        </CardTitle>
        <CardDescription>
          Ordered by observation. Each span has a start and finish; recording
          never retries the operation.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap={5}>
          <div class={s.filter}>
            <Field label="Trace">
              {(control) => (
                <Select
                  value={selection()}
                  onValueChange={setSelected}
                  disabled={!traces().length}
                  items={[
                    {
                      value: "all",
                      label: "All traces",
                    },
                    ...traces().map((trace) => ({
                      value: trace.traceId,
                      label:
                        "" +
                        trace.operation +
                        "\xB7" +
                        trace.traceId.slice(0, 8),
                    })),
                  ]}
                >
                  <SelectTrigger {...control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All traces</SelectItem>
                    <For each={traces()}>
                      {(trace) => (
                        <SelectItem value={trace.traceId}>
                          {trace.operation} · {trace.traceId.slice(0, 8)}
                        </SelectItem>
                      )}
                    </For>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          {(() => {
            const _activeTraceSnapshot = activeTrace();
            return _activeTraceSnapshot ? (
              <Text size="sm" tone="muted" class={s.identifier}>
                Correlation: {_activeTraceSnapshot.correlationId}
              </Text>
            ) : null;
          })()}
          {(() => {
            const _entriesSnapshot = entries();
            return (
              <>
                {_entriesSnapshot.length === 0 ? (
                  <Empty
                    title="No recorded steps"
                    body="Run a scenario to see the path from interaction to request, decoding, and outcome."
                  />
                ) : (
                  <div class={s.timeline}>
                    <Table
                      class={s.events}
                      caption="Diagnostic events"
                      scrollLabel="Diagnostic timeline"
                    >
                      <THead>
                        <Tr>
                          <Th numeric>Event</Th>
                          <Th>Trace</Th>
                          <Th>Stage</Th>
                          <Th>Outcome</Th>
                          <Th numeric>Duration</Th>
                          <Th>Classification</Th>
                        </Tr>
                      </THead>
                      <TBody>
                        <For each={_entriesSnapshot}>
                          {({ sequence, event }) => (
                            <Tr>
                              <Td numeric>{sequence}</Td>
                              <Td>
                                <Text size="sm">{event.operation}</Text>
                                <Text size="sm" tone="muted">
                                  {event.traceId.slice(0, 8)}
                                </Text>
                              </Td>
                              <Td>{event.stage}</Td>
                              <Td>
                                {event.event === "started"
                                  ? "Started"
                                  : event.outcome}
                              </Td>
                              <Td numeric>
                                {event.event === "finished"
                                  ? `${Math.round(event.durationMs)} ms`
                                  : "–"}
                              </Td>
                              <Td>
                                {event.event === "finished" &&
                                event.outcome !== "success" ? (
                                  <Flex direction="column" gap={2}>
                                    <Text size="sm">
                                      {event.failure.kind}
                                      {event.failure.contractRejected
                                        ? " · contract rejected"
                                        : ""}
                                    </Text>
                                    {event.failure.causes.length > 0 && (
                                      <Text size="sm" tone="muted">
                                        Causes:{" "}
                                        {event.failure.causes.join(" → ")}
                                      </Text>
                                    )}
                                  </Flex>
                                ) : (
                                  "–"
                                )}
                              </Td>
                            </Tr>
                          )}
                        </For>
                      </TBody>
                    </Table>
                  </div>
                )}
              </>
            );
          })()}
          <Text size="sm" tone="muted">
            {snapshot().entries.length} of {props.buffer.capacity} records
            retained · {snapshot().dropped} older records evicted. Clear or
            leave this page to discard the local history.
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
