import { asFailure, isRetryable, type Failure, type Result } from "../kernel";
import {
  NOOP_DIAGNOSTICS,
  type DiagnosticEvent,
  type DiagnosticStage,
  type DiagnosticsPort,
  type FailureSummary,
} from "./port";

export function summarizeFailure(failure: Failure): FailureSummary {
  const causes: Failure["kind"][] = [];
  const seen = new Set<Failure>([failure]);
  let current = failure.cause;
  while (current && !seen.has(current) && causes.length < 8) {
    seen.add(current);
    causes.push(current.kind);
    current = current.cause;
  }
  return Object.freeze({
    kind: failure.kind,
    retryable: isRetryable(failure),
    contractRejected: failure.type === "invalid_response",
    causes: Object.freeze(causes),
  });
}

function newId() {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function createTrace(
  port: DiagnosticsPort = NOOP_DIAGNOSTICS,
  context: {
    operation: string;
    correlationId: string;
    traceId?: string;
    now?: () => number;
  },
) {
  const traceId = context.traceId ?? newId();
  const now = () => {
    try {
      const value = (context.now ?? Date.now)();
      if (Number.isFinite(value)) return value;
    } catch {
      /* A broken instrument cannot break the operation it measures. */
    }
    return Date.now();
  };
  let span = 0;
  const emit = (event: DiagnosticEvent) => {
    try {
      const pending = port.record(Object.freeze(event));
      if (pending) void Promise.resolve(pending).catch(() => {});
    } catch {
      /* Reporting is best effort; the original outcome wins. */
    }
  };
  function start(stage: DiagnosticStage) {
    const at = now();
    const base = {
      traceId,
      spanId: `${traceId}:${++span}`,
      correlationId: context.correlationId,
      operation: context.operation,
      stage,
    };
    emit({ ...base, at, event: "started" });
    return (
      result: { ok: true } | { ok: false; error: Failure },
      thrown = false,
    ) => {
      try {
        const ended = now();
        const finish = {
          ...base,
          at: ended,
          event: "finished" as const,
          durationMs: Math.max(0, ended - at),
        };
        if (result.ok) emit({ ...finish, outcome: "success" });
        else
          emit({
            ...finish,
            outcome: thrown
              ? "thrown"
              : result.error.kind === "canceled"
                ? "canceled"
                : "failure",
            failure: summarizeFailure(result.error),
          });
      } catch {
        /* Even failure inspection must not replace the original Result. */
      }
    };
  }
  function recordThrow(finish: ReturnType<typeof start>, cause: unknown) {
    // A thrown value can itself have hostile getters. Classification is still
    // observation: failure to inspect it must not replace the original throw.
    try {
      finish({ ok: false, error: asFailure(cause) }, true);
    } catch {
      /* The caller receives the original value below. */
    }
  }
  return {
    traceId,
    correlationId: context.correlationId,
    async run<T, E extends Failure>(
      stage: DiagnosticStage,
      work: () => Promise<Result<T, E>>,
    ): Promise<Result<T, E>> {
      const finish = start(stage);
      try {
        const result = await work();
        finish(result);
        return result;
      } catch (cause) {
        recordThrow(finish, cause);
        throw cause;
      }
    },
    runSync<T, E extends Failure>(
      stage: DiagnosticStage,
      work: () => Result<T, E>,
    ): Result<T, E> {
      const finish = start(stage);
      try {
        const result = work();
        finish(result);
        return result;
      } catch (cause) {
        recordThrow(finish, cause);
        throw cause;
      }
    },
  };
}
export type DiagnosticTrace = ReturnType<typeof createTrace>;
