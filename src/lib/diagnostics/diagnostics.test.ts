import { describe, expect, it, vi } from "vitest";
import {
  canceled,
  err,
  internal,
  invalid,
  ok,
  timeout,
  type Result,
} from "../kernel";
import { createMemoryClient, withDiagnostics } from "../http";
import { readResponseExample } from "../root/resilience";
import { listItems } from "../services/example";
import {
  createMemoryDiagnostics,
  createTrace,
  summarizeFailure,
  type DiagnosticEvent,
} from ".";

const context = {
  operation: "items.load",
  correlationId: "correlation-1",
  traceId: "trace-1",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("trace observation", () => {
  it("is inert until work starts and preserves the exact Result", async () => {
    const buffer = createMemoryDiagnostics();
    let clock = 100;
    const trace = createTrace(buffer.port, { ...context, now: () => clock++ });
    expect(buffer.get().entries).toHaveLength(0);
    const result = ok({ value: 42 });
    const work = vi.fn(async () => result);
    expect(await trace.run("operation", work)).toBe(result);
    expect(work).toHaveBeenCalledTimes(1);
    expect(buffer.get().entries.map((entry) => entry.event)).toEqual([
      {
        ...context,
        spanId: "trace-1:1",
        stage: "operation",
        at: 100,
        event: "started",
      },
      {
        ...context,
        spanId: "trace-1:1",
        stage: "operation",
        at: 101,
        event: "finished",
        durationMs: 1,
        outcome: "success",
      },
    ]);
  });

  it("observes a successful transport followed by an actual decoder rejection", async () => {
    const buffer = createMemoryDiagnostics();
    const trace = createTrace(buffer.port, context);
    const result = await trace.run("operation", () =>
      readResponseExample("malformed", new AbortController().signal, trace),
    );
    expect(!result.ok && result.error.type).toBe("invalid_response");
    expect(
      buffer
        .get()
        .entries.map(({ event }) => [
          event.stage,
          event.event,
          event.event === "finished" ? event.outcome : null,
        ]),
    ).toEqual([
      ["operation", "started", null],
      ["request", "started", null],
      ["request", "finished", "success"],
      ["decode", "started", null],
      ["decode", "finished", "failure"],
      ["operation", "finished", "failure"],
    ]);
    expect(buffer.get().entries.at(-1)?.event).toMatchObject({
      failure: { kind: "internal", contractRejected: true, retryable: false },
    });
  });

  it("skips decoding on a transport failure and marks deliberate recovery separately", async () => {
    const buffer = createMemoryDiagnostics();
    const trace = createTrace(buffer.port, context);
    await trace.run("operation", () =>
      readResponseExample("unavailable", new AbortController().signal, trace),
    );
    expect(
      buffer.get().entries.some((entry) => entry.event.stage === "decode"),
    ).toBe(false);
    const recovery = createTrace(buffer.port, {
      ...context,
      traceId: "recovery",
      correlationId: "correlation-2",
    });
    await recovery.run("recovery", () =>
      readResponseExample("valid", new AbortController().signal, recovery),
    );
    expect(buffer.get().entries.at(-1)?.event).toMatchObject({
      traceId: "recovery",
      stage: "recovery",
      outcome: "success",
    });
  });

  it("does not record request paths, queries, bodies, or Failure messages/fields/type", async () => {
    const buffer = createMemoryDiagnostics();
    const trace = createTrace(buffer.port, context);
    const inner = createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "POST",
          pattern: /.*/,
          handle: () =>
            err(
              invalid(
                "PRIVATE_MESSAGE",
                { password: "PRIVATE_FIELD" },
                { type: "PRIVATE_TYPE" },
              ),
            ),
        },
      ],
    });
    const result = await withDiagnostics(inner).post("/PRIVATE_PATH", {
      trace,
      params: { secret: "PRIVATE_QUERY" },
      body: { token: "PRIVATE_BODY" },
      headers: { authorization: "PRIVATE_HEADER" },
    });
    expect(result.ok).toBe(false);
    const retained = JSON.stringify(buffer.get());
    expect(retained).not.toContain("PRIVATE_");
    expect(retained).toContain('"kind":"invalid"');
  });

  it("keeps spans and correlation separate for overlapping actions", async () => {
    const buffer = createMemoryDiagnostics();
    const one = createTrace(buffer.port, context);
    const two = createTrace(buffer.port, {
      ...context,
      traceId: "two",
      correlationId: "second",
    });
    const delayed = deferred<Result<number>>();
    const first = one.run("request", () => delayed.promise);
    await two.run("request", async () => ok(2));
    await one.run("request", async () => ok(3));
    delayed.resolve(ok(1));
    await first;
    const starts = buffer
      .get()
      .entries.filter((entry) => entry.event.event === "started");
    expect(new Set(starts.map((entry) => entry.event.spanId)).size).toBe(3);
    expect(buffer.get().entries.at(-1)?.event).toMatchObject({
      traceId: "trace-1",
      correlationId: "correlation-1",
      spanId: "trace-1:1",
    });
  });

  it("records cancellation as cancellation, never as a retry", async () => {
    const buffer = createMemoryDiagnostics();
    const trace = createTrace(buffer.port, context);
    const result = err(canceled("private cancellation details"));
    expect(await trace.run("request", async () => result)).toBe(result);
    expect(buffer.get().entries.at(-1)?.event).toMatchObject({
      outcome: "canceled",
      failure: { kind: "canceled", retryable: false },
    });
  });

  it("preserves thrown values and keeps their text out of the recorder", async () => {
    const buffer = createMemoryDiagnostics();
    const trace = createTrace(buffer.port, context);
    const cause = new Error("PRIVATE_EXCEPTION");
    await expect(
      trace.run("operation", async () => {
        throw cause;
      }),
    ).rejects.toBe(cause);
    expect(() =>
      trace.runSync("decode", () => {
        throw cause;
      }),
    ).toThrow(cause);
    expect(buffer.get().entries.at(-1)?.event).toMatchObject({
      outcome: "thrown",
    });
    expect(JSON.stringify(buffer.get())).not.toContain("PRIVATE_EXCEPTION");
  });

  it("broken sinks and clocks cannot replace a result or invoke the operation twice", async () => {
    for (const record of [
      () => {
        throw new Error("sink");
      },
      () => Promise.reject(new Error("sink")),
      () => new Promise<void>(() => {}),
    ]) {
      const trace = createTrace(
        { record },
        {
          ...context,
          now: () => {
            throw new Error("clock");
          },
        },
      );
      const answer = err(timeout("offline"));
      const work = vi.fn(async () => answer);
      expect(await trace.run("request", work)).toBe(answer);
      expect(trace.runSync("decode", () => answer)).toBe(answer);
      expect(work).toHaveBeenCalledTimes(1);
    }
  });

  it("preserves thrown objects even when classifying them invokes a throwing getter", async () => {
    const cause = {
      get failure() {
        throw new Error("inspection failed");
      },
    };
    const trace = createTrace(createMemoryDiagnostics().port, context);
    await expect(
      trace.run("operation", async () => {
        throw cause;
      }),
    ).rejects.toBe(cause);
    let caught: unknown;
    try {
      trace.runSync("decode", () => {
        throw cause;
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(cause);
  });

  it("a broken failure getter cannot change the original result", async () => {
    const failure = internal("private");
    Object.defineProperty(failure, "cause", {
      get() {
        throw new Error("getter");
      },
    });
    const result = err(failure);
    const trace = createTrace(createMemoryDiagnostics().port, context);
    expect(await trace.run("request", async () => result)).toBe(result);
  });

  it("bounds cause traversal and terminates on cycles", () => {
    const cause = internal("cause");
    const failure = timeout("outer", { cause });
    cause.cause = failure;
    expect(summarizeFailure(failure)).toEqual({
      kind: "timeout",
      retryable: true,
      contractRejected: false,
      causes: ["internal"],
    });
  });

  it("ordinary calls record nothing and keep working without a trace", async () => {
    const client = withDiagnostics(
      createMemoryClient({
        latencyMs: 0,
        routes: [{ method: "GET", pattern: /.*/, handle: () => ok([]) }],
      }),
    );
    expect((await listItems(client, "w")).unwrapOr(null)).toEqual([]);
  });
});

describe("bounded memory recorder", () => {
  it("has stable immutable snapshots, counts eviction, and clears retained history", () => {
    const buffer = createMemoryDiagnostics({ capacity: 3 });
    const initial = buffer.get();
    expect(buffer.get()).toBe(initial);
    const trace = createTrace(buffer.port, context);
    trace.runSync("decode", () => ok(1));
    const previous = buffer.get();
    trace.runSync("decode", () => ok(2));
    expect(buffer.get().entries.map((entry) => entry.sequence)).toEqual([
      2, 3, 4,
    ]);
    expect(buffer.get().dropped).toBe(1);
    expect(previous.entries).toHaveLength(2);
    expect(Object.isFrozen(buffer.get().entries[0].event)).toBe(true);
    expect(Object.isFrozen(buffer.get().entries)).toBe(true);
    buffer.clear();
    expect(buffer.get()).toEqual({ entries: [], dropped: 0 });
    expect(buffer.server()).toBe(initial);
  });

  it("projects extra runtime properties and bounds strings at the sink too", () => {
    const buffer = createMemoryDiagnostics();
    const event = {
      ...context,
      operation: "a".repeat(300),
      spanId: "span",
      stage: "request",
      at: 0,
      event: "finished",
      durationMs: 2,
      outcome: "failure",
      failure: {
        kind: "internal",
        retryable: false,
        contractRejected: false,
        causes: [],
        message: "PRIVATE_NESTED",
      },
      body: "PRIVATE_BODY",
    };
    buffer.port.record(event as DiagnosticEvent);
    expect(JSON.stringify(buffer.get())).not.toContain("PRIVATE_");
    expect(buffer.get().entries[0].event.operation).toHaveLength(96);
  });

  it("cleans up subscriptions and contains a broken inspector listener", () => {
    const buffer = createMemoryDiagnostics();
    const notified = vi.fn();
    const stop = buffer.subscribe(notified);
    buffer.subscribe(() => {
      throw new Error("inspector");
    });
    buffer.clear();
    expect(notified).toHaveBeenCalledTimes(1);
    stop();
    stop();
    buffer.clear();
    expect(notified).toHaveBeenCalledTimes(1);
  });
});
