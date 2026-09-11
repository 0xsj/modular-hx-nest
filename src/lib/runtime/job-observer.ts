import { asFailure, err, internal, type Failure, type Result } from "../kernel";
import { terminalJob, type Job, type CancelReceipt } from "../services/jobs";
import { createStore } from "./store";

export type JobPort = {
  read(id: string, signal: AbortSignal): Promise<Result<Job>>;
  cancel(id: string, signal: AbortSignal): Promise<Result<CancelReceipt>>;
};
type CancelState = "idle" | "pending" | "accepted" | "too-late" | "unknown";
const snapshotKey = (job: Job) =>
  JSON.stringify([
    job.id,
    job.kind,
    job.revision,
    job.state,
    job.state === "running"
      ? job.progress
      : job.state === "completed"
        ? job.summary
        : job.state === "failed"
          ? job.reason
          : null,
  ]);
export type JobObserverState = {
  watching: boolean;
  refreshing: boolean;
  job: Job | null;
  failure?: Failure;
  cancellation: CancelState;
  cancelFailure?: Failure;
};
export function createJobObserver(id: string, port: JobPort) {
  const store = createStore<JobObserverState>({
    watching: false,
    refreshing: false,
    job: null,
    cancellation: "idle",
  });
  let readGeneration = 0,
    cancelGeneration = 0;
  let reader: AbortController | undefined,
    canceler: AbortController | undefined;
  const update = (patch: Partial<JobObserverState>) =>
    store.set({ ...store.get(), ...patch });
  async function refresh() {
    if (!store.get().watching) return;
    reader?.abort();
    reader = new AbortController();
    const own = ++readGeneration;
    update({ refreshing: true, failure: undefined });
    let result: Result<Job>;
    try {
      result = await port.read(id, reader.signal);
    } catch (cause) {
      result = err(asFailure(cause));
    }
    if (own !== readGeneration) return;
    const previous = store.get().job;
    if (result.ok) {
      const job = result.value;
      if (
        job.id !== id ||
        (previous &&
          (job.kind !== previous.kind ||
            job.revision < previous.revision ||
            (job.revision === previous.revision &&
              snapshotKey(job) !== snapshotKey(previous)) ||
            (terminalJob(previous) &&
              snapshotKey(job) !== snapshotKey(previous)) ||
            (previous.state === "running" && job.state === "queued")))
      )
        result = err(
          internal("The job snapshot is obsolete or inconsistent.", {
            type: "invalid_response",
          }),
        );
    }
    if (result.ok) update({ job: result.value, refreshing: false });
    else update({ refreshing: false, failure: result.error });
  }
  function stop() {
    readGeneration++;
    reader?.abort();
    update({ watching: false, refreshing: false });
  }
  return {
    get: store.get,
    server: store.server,
    subscribe: store.subscribe,
    start() {
      update({ watching: true });
      return refresh();
    },
    refresh,
    hint: refresh,
    stop,
    async cancel() {
      const state = store.get();
      if (!state.job || terminalJob(state.job) || state.cancellation !== "idle")
        return;
      const own = ++cancelGeneration;
      canceler = new AbortController();
      update({ cancellation: "pending", cancelFailure: undefined });
      let result: Result<CancelReceipt>;
      try {
        result = await port.cancel(id, canceler.signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== cancelGeneration) return;
      if (result.ok && result.value.id !== id)
        result = err(
          internal("Cancellation acknowledged another job.", {
            type: "invalid_response",
          }),
        );
      if (result.ok)
        update({
          cancellation: result.value.accepted ? "accepted" : "too-late",
        });
      else update({ cancellation: "unknown", cancelFailure: result.error });
      await refresh();
    },
    dispose() {
      stop();
      cancelGeneration++;
      canceler?.abort();
      if (store.get().cancellation === "pending")
        update({ cancellation: "unknown" });
    },
  };
}
