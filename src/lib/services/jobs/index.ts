import {
  responseDecoder,
  responseObject,
  responseText,
  type HttpClient,
  type CallOptions,
} from "../../http";
import { err, internal, type Result } from "../../kernel";

type JobBase = { id: string; revision: number; kind: "import" | "export" };
export type Job = JobBase &
  (
    | { state: "queued" }
    | { state: "running"; progress: number | null }
    | { state: "completed"; summary: string }
    | { state: "failed"; reason: string }
    | { state: "canceled" }
  );
export type CancelReceipt = { id: string; accepted: boolean };
export const terminalJob = (job: Job) =>
  job.state === "completed" ||
  job.state === "failed" ||
  job.state === "canceled";
export const decodeJob = responseDecoder("job", (raw): Job | undefined => {
  const v = responseObject(raw);
  if (
    !v ||
    !responseText(v.id) ||
    !Number.isSafeInteger(v.revision) ||
    (v.revision as number) < 1 ||
    (v.kind !== "import" && v.kind !== "export")
  )
    return;
  const base: JobBase = {
    id: v.id,
    revision: v.revision as number,
    kind: v.kind,
  };
  if (v.state === "queued" || v.state === "canceled")
    return { ...base, state: v.state };
  if (
    v.state === "running" &&
    (v.progress === null ||
      (typeof v.progress === "number" &&
        Number.isFinite(v.progress) &&
        v.progress >= 0 &&
        v.progress <= 100))
  )
    return { ...base, state: v.state, progress: v.progress };
  if (v.state === "completed" && responseText(v.summary))
    return { ...base, state: v.state, summary: v.summary };
  if (v.state === "failed" && responseText(v.reason))
    return { ...base, state: v.state, reason: v.reason };
});
const decodeCancel = responseDecoder(
  "job cancellation acknowledgment",
  (raw): CancelReceipt | undefined => {
    const v = responseObject(raw);
    return v && responseText(v.id) && typeof v.accepted === "boolean"
      ? { id: v.id, accepted: v.accepted }
      : undefined;
  },
);
function owned<T extends { id: string }>(
  result: Result<T>,
  id: string,
): Result<T> {
  return result.ok && result.value.id !== id
    ? err(
        internal("The response belongs to another job.", {
          type: "invalid_response",
        }),
      )
    : result;
}
export async function readJob(
  client: HttpClient,
  id: string,
  options?: CallOptions,
): Promise<Result<Job>> {
  return owned(
    (
      await client.get<unknown>(`/jobs/${encodeURIComponent(id)}`, options)
    ).andThen((value) => decodeJob(value, options?.trace)),
    id,
  );
}
export async function cancelJob(
  client: HttpClient,
  id: string,
  options?: CallOptions,
): Promise<Result<CancelReceipt>> {
  return owned(
    (
      await client.post<unknown>(
        `/jobs/${encodeURIComponent(id)}/cancel`,
        options,
      )
    ).andThen((value) => decodeCancel(value, options?.trace)),
    id,
  );
}
