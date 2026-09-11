import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
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
import type { ResponseMode } from "~/lib/root/resilience";
import { createRaceExample, readResponseExample } from "~/lib/root/resilience";
import type { ReadState } from "~/lib/runtime/latest-read";
import { createLatestRead } from "~/lib/runtime/latest-read";
import { observeStore } from "~/lib/runtime/observe";
import type { Item } from "~/lib/services/example";
import { NoteDemo } from "./note-demo";
import { createRaceModel } from "./race-model";
import s from "./resilience.module.css";
const RESPONSE_MODES: Array<{
  mode: ResponseMode;
  label: string;
}> = [
  {
    mode: "valid",
    label: "Load valid data",
  },
  {
    mode: "malformed",
    label: "Wrong envelope",
  },
  {
    mode: "partial",
    label: "Malformed list item",
  },
  {
    mode: "unavailable",
    label: "Refresh failure",
  },
  {
    mode: "empty",
    label: "Empty list",
  },
];
function ReadResults(props: { state: ReadState<Item[]> }) {
  const data = createMemo(() =>
    props.state.state === "ready"
      ? props.state.value
      : props.state.state === "idle"
        ? undefined
        : props.state.previous,
  );
  return (
    <div class={s.result} aria-busy={props.state.state === "pending"}>
      {props.state.state === "failed" && (
        <Alert tone="warn" title="This region could not be refreshed">
          {props.state.failure.message}
        </Alert>
      )}
      {(() => {
        const _dataSnapshot = data();
        return _dataSnapshot === undefined ? (
          <Text size="sm" tone="muted">
            {props.state.state === "pending"
              ? "Loading…"
              : "No successful read yet."}
          </Text>
        ) : _dataSnapshot.length === 0 ? (
          <Text size="sm">The request succeeded. No items were found.</Text>
        ) : (
          <ul class={s.items}>
            <For each={_dataSnapshot}>
              {(item) => (
                <li>
                  <Text weight="medium">{item.name}</Text>
                  <Text size="sm" tone="muted">
                    {item.host}
                  </Text>
                </li>
              )}
            </For>
          </ul>
        );
      })()}
    </div>
  );
}
function ResponseDemo() {
  const reader = createLatestRead(readResponseExample);
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
  const stale = createMemo(() => {
    const _stateSnapshot = state();
    return (
      _stateSnapshot.state === "failed" && _stateSnapshot.previous !== undefined
    );
  });
  const status = createMemo(() => {
    const _stateSnapshot2 = state();
    return _stateSnapshot2.state === "idle"
      ? "Choose a response to begin."
      : _stateSnapshot2.state === "pending"
        ? "Requesting the next response…"
        : _stateSnapshot2.state === "failed"
          ? stale()
            ? "Refresh failed. Previous data is still visible and may be stale."
            : "Request failed. No data has been accepted."
          : _stateSnapshot2.value.length
            ? "Valid response accepted."
            : "Valid empty response accepted.";
  });
  return (
    <Card aria-labelledby="response-title">
      <CardHeader
        actions={
          <Badge tone={stale() ? "warn" : "neutral"}>
            {stale() ? "Stale data" : "Response boundary"}
          </Badge>
        }
      >
        <CardTitle id="response-title" level={2}>
          Keep the last good view
        </CardTitle>
        <CardDescription>
          A malformed success cannot replace validated data. A real empty result
          can.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap={5}>
          <ReadResults state={state()} />
          <Text size="sm" tone="muted" role="status" aria-atomic="true">
            {status()}
          </Text>
        </Flex>
      </CardBody>
      <CardFooter>
        <Flex gap={3} wrap>
          <For each={RESPONSE_MODES}>
            {({ mode, label }) => (
              <Button
                size="sm"
                intent={mode === "valid" ? "primary" : "secondary"}
                onClick={() => void reader.run(mode)}
              >
                {label}
              </Button>
            )}
          </For>
        </Flex>
      </CardFooter>
    </Card>
  );
}
function RaceDemo() {
  const model = createRaceModel(createRaceExample);
  const phase = observeStore(
    model.phase.subscribe,
    model.phase.get,
    model.phase.server,
  );
  const state = observeStore(
    model.reader.subscribe,
    model.reader.get,
    model.reader.server,
  );
  createEffect(
    on(
      () => [model],
      () => {
        const cleanup = () => model.cancel();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const status = createMemo(() => {
    const _phaseSnapshot = phase();
    return _phaseSnapshot === "idle"
      ? "Start the sequence to make two selections."
      : _phaseSnapshot === "running"
        ? "The earlier response is held while the newer selection loads."
        : _phaseSnapshot === "waiting"
          ? "Newer selection is visible. The earlier response is still held."
          : "Earlier response delivered. The newer selection remains visible.";
  });
  return (
    <Card aria-labelledby="race-title">
      <CardHeader actions={<Badge tone="neutral">Response order</Badge>}>
        <CardTitle id="race-title" level={2}>
          Let the latest selection win
        </CardTitle>
        <CardDescription>
          Two reads finish out of order. The older one even ignores
          cancellation.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap={5}>
          <ol class={s.steps}>
            <li>Start an earlier read and hold its response.</li>
            <li>Make a newer selection and display its result.</li>
            <li>Release the older response without changing the view.</li>
          </ol>
          <ReadResults state={state()} />
          <Text size="sm" tone="muted" role="status" aria-atomic="true">
            {status()}
          </Text>
        </Flex>
      </CardBody>
      <CardFooter>
        <Flex gap={3} wrap>
          <Button
            size="sm"
            intent="primary"
            disabled={(() => {
              const _phaseSnapshot2 = phase();
              return (
                _phaseSnapshot2 === "running" || _phaseSnapshot2 === "waiting"
              );
            })()}
            onClick={() => void model.start()}
          >
            {phase() === "complete" ? "Replay sequence" : "Start sequence"}
          </Button>
          <Button
            size="sm"
            disabled={phase() !== "waiting"}
            onClick={() => void model.release()}
          >
            Release earlier response
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
}
export function ResilienceDemo() {
  const [noteVersion, setNoteVersion] = createSignal(0);
  return (
    <Flex direction="column" gap={7}>
      <Alert tone="info" title="A safe place to break things">
        These isolated simulations change no account data. Each sequence is
        controlled and repeatable.
      </Alert>
      <div class={s.examples}>
        <ResponseDemo />
        <RaceDemo />
      </div>
      <Show keyed when={`note:${noteVersion()}`}>
        {(_key) => (
          <NoteDemo onReset={() => setNoteVersion((version) => version + 1)} />
        )}
      </Show>
    </Flex>
  );
}
