import { createMemoryClient } from "../http";
import { err, ok, timeout, unavailable } from "../kernel";
import { cancelJob, readJob, terminalJob, type Job } from "../services/jobs";

export type CancelMode = "accept" | "lost-response" | "complete-first";
/** Manual clock: advance changes the simulated server, even while disconnected
 * or unwatched. No wall-clock percentage and no hidden auto-retried command. */
export function createJobExample(
  kind: Job["kind"] = "export",
  latencyMs = 200,
) {
  let job: Job = { id: `${kind}-demo`, revision: 1, kind, state: "queued" };
  let connected = true,
    requested = false,
    cancelMode: CancelMode = "accept";
  const listeners = new Set<() => void>();
  const emit = () => {
    if (connected) for (const listener of listeners) listener();
  };
  const client = createMemoryClient({
    latencyMs,
    routes: [
      {
        method: "GET",
        pattern: /^\/jobs\/[^/]+$/,
        handle: () =>
          connected
            ? ok({ ...job })
            : err(
                unavailable(
                  "The job connection is offline. Reconnect to read its current state.",
                ),
              ),
      },
      {
        method: "POST",
        pattern: /^\/jobs\/[^/]+\/cancel$/,
        handle: () => {
          if (!connected)
            return err(unavailable("The cancellation could not be confirmed."));
          if (cancelMode === "complete-first" && !terminalJob(job))
            job = {
              id: job.id,
              kind,
              revision: job.revision + 1,
              state: "completed",
              summary: "240 records processed before cancellation arrived.",
            };
          if (terminalJob(job)) return ok({ id: job.id, accepted: false });
          requested = true;
          return cancelMode === "lost-response"
            ? err(
                timeout(
                  "The cancellation response was lost. Refresh the job to learn its outcome.",
                ),
              )
            : ok({ id: job.id, accepted: true });
        },
      },
    ],
  });
  return {
    id: job.id,
    read: (id: string, signal: AbortSignal) => readJob(client, id, { signal }),
    cancel: (id: string, signal: AbortSignal) =>
      cancelJob(client, id, { signal }),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(value: boolean) {
      connected = value;
      if (value) emit();
    },
    setCancelMode(value: CancelMode) {
      cancelMode = value;
    },
    advance() {
      if (terminalJob(job)) return;
      const base = { id: job.id, kind, revision: job.revision + 1 };
      job = requested
        ? { ...base, state: "canceled" }
        : job.state === "queued"
          ? { ...base, state: "running", progress: null }
          : job.state === "running" && job.progress === null
            ? { ...base, state: "running", progress: 45 }
            : {
                ...base,
                state: "completed",
                summary: "240 records processed successfully.",
              };
      emit();
    },
    fail() {
      if (!terminalJob(job)) {
        job = {
          id: job.id,
          kind,
          revision: job.revision + 1,
          state: "failed",
          reason:
            "The source file contains an unsupported column. Correct it before starting a new import.",
        };
        emit();
      }
    },
  };
}
