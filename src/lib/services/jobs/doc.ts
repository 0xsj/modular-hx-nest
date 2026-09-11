/**
 * Long-running job contract
 * =========================
 * A job has id, monotonic revision, kind import/export, and a discriminated
 * queued/running/completed/failed/canceled state. Running progress is null
 * (unmeasured) or 0..100, never invented from elapsed time. Only completed
 * jobs carry an output summary; only failed jobs carry an explanation.
 * Services decode unknown wire values and verify the requested job identity.
 *
 * An observer reads authoritative snapshots through an injected port. A stream
 * event is an invalidation hint, not a completion fact. Reconnect reads again.
 * Old revisions, regressive states and late responses are not accepted.
 * Stop watching aborts local work and never cancels the server job. A cancel
 * request is acknowledged separately; even an accepted request may still race
 * with completion. Lost cancellation responses require refresh, never invented
 * canceled state. No automatic write retries. Disposal ignores late work.
 *
 * Cookbook simulates a server with explicit advance, unknown/known progress,
 * failure, disconnection, lost cancel acknowledgment, and completion racing
 * cancel. This example tracks an existing job; creating/uploading jobs is a
 * product-specific idempotent command, deliberately outside this contract.
 * Production requires authenticated job ownership, revision ordering, durable
 * status/result retention and honest cancellation semantics at the adapter.
 * Written before implementation; tests are ordinary implementation-visible.
 */
export {};
