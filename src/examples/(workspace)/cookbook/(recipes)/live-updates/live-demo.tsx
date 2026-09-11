import { createMemo, createSignal, createUniqueId } from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Stat,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { asFailure } from "~/lib/kernel";
import { keys, useLiveQueries, useResourceQuery } from "~/lib/query";
import type { DemoEvent } from "./demo-source";
import { createLiveDemo } from "./demo-source";
import s from "./live-demo.module.css";
export function LiveDemo() {
  const instance = createUniqueId();
  const demo = createLiveDemo();
  const [outage, setOutage] = createSignal(false);
  const key = createMemo(() => keys.cookbook.live(instance));
  const resync = createMemo(() => [key()]);
  const affected = createMemo(
    () => (event: DemoEvent) =>
      event.type === "metrics.changed" ? resync() : [],
  );
  const live = useLiveQueries({
    source: demo.source,
    affected: affected(),
    resync: resync(),
  });
  const query = useResourceQuery({
    key: key(),
    read: demo.read,
  });
  const connected = createMemo(() => live.connection.state === "open");
  return (
    <Flex direction="column" gap={7}>
      <Alert tone="info" title="A controllable live-data example">
        Events and data come from an in-process simulation. Emit an update,
        disconnect while more updates arrive, then reconnect to catch up.
      </Alert>
      <Card>
        <CardHeader
          actions={
            <Badge
              glyph={connected() ? "●" : "○"}
              tone={connected() ? "accent" : "neutral"}
            >
              {connected() ? "Connected" : "Disconnected"}
            </Badge>
          }
        >
          <CardTitle level={2}>Activity at a glance</CardTitle>
        </CardHeader>
        <CardBody>
          {query.error && (
            <Alert
              tone="warn"
              title="The latest data could not be loaded"
              live="polite"
            >
              {asFailure(query.error).message} The last successful values remain
              visible.
            </Alert>
          )}
          {live.failure && (
            <Alert tone="warn" title="A live update could not be applied">
              {live.failure.message}
            </Alert>
          )}
          {!connected() && (
            <Text size="sm" tone="muted">
              Updates are disconnected. These values may be out of date.
            </Text>
          )}
          <div class={s.stats} aria-busy={query.isFetching}>
            <Stat
              label="Requests"
              value={query.data?.requests}
              hint="changes with each simulated event"
            />
            <Stat
              label="Queued jobs"
              value={query.data?.queued}
              hint="zero remains a measured value"
            />
            <Stat
              label="Data revision"
              value={query.data?.revision}
              hint={query.isFetching ? "Refreshing…" : "last successful read"}
            />
            <Stat
              label="Completed reads"
              value={query.data?.reads}
              hint="a burst is coalesced into one refresh"
            />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={2}>Drive the example</CardTitle>
        </CardHeader>
        <CardBody>
          <Flex gap={4} wrap>
            <Button intent="primary" onClick={demo.emit}>
              Emit update
            </Button>
            <Button
              onClick={() => {
                for (let i = 0; i < 5; i++) demo.emit();
              }}
            >
              Emit 5 updates
            </Button>
            <Button
              onClick={() =>
                connected() ? demo.source.disconnect() : demo.source.reconnect()
              }
            >
              {connected() ? "Disconnect" : "Reconnect"}
            </Button>
            <Button
              onClick={() => {
                demo.failReads(!outage());
                setOutage(!outage());
                demo.emit();
              }}
            >
              {outage() ? "Restore data source" : "Simulate read failure"}
            </Button>
          </Flex>
          <Text size="sm" tone="muted">
            The event marks this region’s data as stale. Reconnecting requests
            the latest state, including updates missed while disconnected.
          </Text>
        </CardBody>
      </Card>
    </Flex>
  );
}
