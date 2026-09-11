import type { FailureKind } from "../kernel";

export type DiagnosticStage = "operation" | "request" | "decode" | "recovery";
export type FailureSummary = Readonly<{
  kind: FailureKind;
  retryable: boolean;
  contractRejected: boolean;
  causes: readonly FailureKind[];
}>;
type EventContext = Readonly<{
  traceId: string;
  spanId: string;
  correlationId: string;
  /** Trusted static operation label. Never a URL, form value, or wire message. */
  operation: string;
  stage: DiagnosticStage;
  at: number;
}>;
export type DiagnosticEvent = EventContext &
  (
    | { event: "started" }
    | { event: "finished"; durationMs: number; outcome: "success" }
    | {
        event: "finished";
        durationMs: number;
        outcome: "failure" | "canceled" | "thrown";
        failure: FailureSummary;
      }
  );

/** An exporter owns its own delivery/retry policy. Recording cannot block work. */
export type DiagnosticsPort = {
  record: (event: DiagnosticEvent) => void | Promise<void>;
};
export const NOOP_DIAGNOSTICS: DiagnosticsPort = Object.freeze({ record() {} });
