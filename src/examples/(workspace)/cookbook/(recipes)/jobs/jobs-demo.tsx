import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  Show,
  untrack,
} from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/display";
import { Alert, Progress } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { createJobExample, type CancelMode } from "~/lib/root/jobs";
import { createJobObserver } from "~/lib/runtime/job-observer";
import { observeStore } from "~/lib/runtime/observe";
import { terminalJob, type Job } from "~/lib/services/jobs";
import s from "../_components/recipe.module.css";
import { ScenarioChoice } from "../_components/scenario-choice";
export function JobsDemo() {
  const [kind, setKind] = createSignal<Job["kind"]>("export"),
    [version, setVersion] = createSignal(0);
  return (
    <>
      <Flex gap={4} wrap>
        <ScenarioChoice
          label="Example job"
          value={kind()}
          options={[
            {
              value: "export",
              label: "Export records",
            },
            {
              value: "import",
              label: "Import records",
            },
          ]}
          onChange={setKind}
        />
        <Button onClick={() => setVersion((value) => value + 1)}>
          Reset job simulation
        </Button>
      </Flex>
      <Show keyed when={`${kind()}:${version()}`}>
        {(_key) => <JobDemo kind={kind()} />}
      </Show>
      <Text size="sm" tone="muted">
        Frontend: treat events as refresh hints, reject stale snapshots, and
        keep cancellation separate from observation. Backend: authorize job
        ownership, persist status and revisions, and report cancellation
        truthfully. This recipe observes a pre-existing simulated job; starting
        jobs and delivering files remain product-specific adapter work.
        Resetting or leaving clears this in-memory simulation.
      </Text>
    </>
  );
}
function JobDemo(props: { kind: Job["kind"] }) {
  const root = createJobExample(untrack(() => props.kind));
  const model = createJobObserver(root.id, root);
  const state = observeStore(model.subscribe, model.get, model.server);
  const [connected, setConnected] = createSignal(true),
    [mode, setMode] = createSignal<CancelMode>("accept");
  createEffect(
    on(
      () => [model, root],
      () => {
        const cleanup = (() => {
          const unsubscribe = root.subscribe(() => {
            void model.hint();
          });
          void model.start();
          return () => {
            unsubscribe();
            model.dispose();
          };
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const job = createMemo(() => state().job),
    terminal = createMemo(() => {
      const _jobSnapshot = job();
      return _jobSnapshot && terminalJob(_jobSnapshot);
    });
  return (
    <div class={s.columns}>
      <Card>
        <CardHeader
          actions={
            <Badge tone={job()?.state === "failed" ? "warn" : "neutral"}>
              {job()?.state ?? "Loading"}
            </Badge>
          }
        >
          <CardTitle level={2}>
            {props.kind === "export" ? "Records export" : "Records import"}
          </CardTitle>
          <CardDescription>
            Job {root.id}.{" "}
            {(() => {
              const _jobSnapshot2 = job();
              return _jobSnapshot2
                ? `Last accepted revision: ${_jobSnapshot2.revision}.`
                : "Reading the first snapshot.";
            })()}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap={5}>
            {job()?.state === "queued" && (
              <Text>Queued. No progress has been measured.</Text>
            )}
            {(() => {
              const _jobSnapshot3 = job();
              return _jobSnapshot3?.state === "running" ? (
                <>
                  <Progress
                    label="Job progress"
                    value={_jobSnapshot3.progress}
                  />
                  <Text>
                    {_jobSnapshot3.progress === null
                      ? "Running · progress has not been measured"
                      : `${_jobSnapshot3.progress}% measured progress`}
                  </Text>
                </>
              ) : null;
            })()}
            {(() => {
              const _jobSnapshot4 = job();
              return _jobSnapshot4?.state === "completed" ? (
                <Alert tone="accent" title="Job completed">
                  {_jobSnapshot4.summary}
                </Alert>
              ) : null;
            })()}
            {(() => {
              const _jobSnapshot5 = job();
              return _jobSnapshot5?.state === "failed" ? (
                <Alert tone="warn" title="Job failed">
                  {_jobSnapshot5.reason}
                </Alert>
              ) : null;
            })()}
            {job()?.state === "canceled" && (
              <Alert tone="info" title="Cancellation confirmed">
                The server reports that this job was canceled.
              </Alert>
            )}
            <Text size="sm" role="status">
              {(() => {
                const _stateSnapshot = state();
                return !_stateSnapshot.watching
                  ? "Observation stopped. The job may still be running."
                  : _stateSnapshot.refreshing
                    ? "Reading the current job state…"
                    : !connected() || _stateSnapshot.failure
                      ? "The last accepted snapshot may be out of date."
                      : "Watching for job changes.";
              })()}
            </Text>
            {(() => {
              const _stateSnapshot2 = state();
              return _stateSnapshot2.failure ? (
                <Alert tone="warn" title="Job refresh failed">
                  {_stateSnapshot2.failure.message}
                </Alert>
              ) : null;
            })()}
            <Flex wrap gap={3}>
              <Button
                onClick={() => {
                  if (state().watching) model.stop();
                  else void model.start();
                }}
              >
                {state().watching ? "Stop watching" : "Resume watching"}
              </Button>
              <Button
                disabled={(() => {
                  const _stateSnapshot3 = state();
                  return (
                    !_stateSnapshot3.watching || _stateSnapshot3.refreshing
                  );
                })()}
                onClick={() => void model.refresh()}
              >
                Refresh job
              </Button>
              <Button
                intent="danger"
                disabled={
                  !job() || !!terminal() || state().cancellation !== "idle"
                }
                onClick={() => void model.cancel()}
              >
                Request cancellation
              </Button>
            </Flex>
            {(() => {
              const _stateSnapshot4 = state();
              return _stateSnapshot4.cancellation !== "idle" ? (
                <Alert tone="info" title="Cancellation request">
                  {_stateSnapshot4.cancellation === "pending"
                    ? "Waiting for an acknowledgment."
                    : _stateSnapshot4.cancellation === "accepted"
                      ? "Request accepted. Keep watching for the final job state; completion may still win the race."
                      : _stateSnapshot4.cancellation === "too-late"
                        ? "The job finished before cancellation could be accepted."
                        : "The request outcome is unknown. Refresh status; do not assume the job stopped."}
                  {_stateSnapshot4.cancelFailure &&
                    ` ${_stateSnapshot4.cancelFailure.message}`}
                </Alert>
              ) : null;
            })()}
          </Flex>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={2}>Advance the simulated server</CardTitle>
          <CardDescription>
            Each step changes the job independently of whether this page is
            watching. Events prompt a fresh read.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap={5}>
            <Flex wrap gap={3}>
              <Button onClick={() => root.advance()}>Advance server job</Button>
              <Button onClick={() => root.fail()}>Fail server job</Button>
              <Button
                onClick={() => {
                  const next = !connected();
                  setConnected(next);
                  root.connect(next);
                  if (!next) void model.refresh();
                }}
              >
                {connected() ? "Disconnect" : "Reconnect"}
              </Button>
            </Flex>
            <ScenarioChoice
              label="Cancellation behavior"
              value={mode()}
              options={[
                {
                  value: "accept",
                  label: "Accept, then stop on next server step",
                },
                {
                  value: "lost-response",
                  label: "Accept, but lose the acknowledgment",
                },
                {
                  value: "complete-first",
                  label: "Completion wins the race",
                },
              ]}
              onChange={(value) => {
                setMode(value);
                root.setCancelMode(value);
              }}
            />
            <Text size="sm" tone="muted">
              Queued → running with unknown progress → measured progress →
              completed. An accepted cancellation takes effect on the next
              server step.
            </Text>
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
}
