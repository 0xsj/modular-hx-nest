import type { DiagnosticEvent, DiagnosticsPort } from "./port";

export type DiagnosticEntry = Readonly<{
  sequence: number;
  event: DiagnosticEvent;
}>;
export type DiagnosticSnapshot = Readonly<{
  entries: readonly DiagnosticEntry[];
  dropped: number;
}>;
const EMPTY: DiagnosticSnapshot = Object.freeze({
  entries: Object.freeze([]),
  dropped: 0,
});

const label = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 96);

/** Project a typed event again, so accidental extra runtime properties cannot
 * turn this buffer (or a future export of it) into a bag of sensitive data. */
function project(event: DiagnosticEvent): DiagnosticEvent {
  const base = {
    traceId: label(event.traceId),
    spanId: label(event.spanId),
    correlationId: label(event.correlationId),
    operation: label(event.operation),
    stage: event.stage,
    at: event.at,
  };
  if (event.event === "started")
    return Object.freeze({ ...base, event: "started" });
  const finish = {
    ...base,
    event: "finished" as const,
    durationMs: event.durationMs,
  };
  if (event.outcome === "success")
    return Object.freeze({ ...finish, outcome: "success" });
  return Object.freeze({
    ...finish,
    outcome: event.outcome,
    failure: Object.freeze({
      kind: event.failure.kind,
      retryable: event.failure.retryable,
      contractRejected: event.failure.contractRejected,
      causes: Object.freeze(event.failure.causes.slice(0, 8)),
    }),
  });
}

/** Capacity is bounded even when a caller provides a bad runtime setting. */
export function createMemoryDiagnostics(options: { capacity?: number } = {}) {
  const requested = options.capacity ?? 200;
  const capacity =
    Number.isInteger(requested) && requested > 0
      ? Math.min(requested, 5000)
      : 200;
  let snapshot = EMPTY;
  let sequence = 0;
  const listeners = new Set<() => void>();
  function publish(next: DiagnosticSnapshot) {
    snapshot = Object.freeze(next);
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        /* An inspector is also an observer. */
      }
    }
  }
  const port: DiagnosticsPort = {
    record(event) {
      const entry = Object.freeze({
        sequence: ++sequence,
        event: project(event),
      });
      const entries = [...snapshot.entries, entry];
      const excess = Math.max(0, entries.length - capacity);
      publish({
        entries: Object.freeze(entries.slice(excess)),
        dropped: snapshot.dropped + excess,
      });
    },
  };
  return {
    port,
    capacity,
    get: () => snapshot,
    server: () => EMPTY,
    clear() {
      publish(EMPTY);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
