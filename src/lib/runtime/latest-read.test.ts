import { describe, expect, it } from "vitest";
import { err, internal, ok, type Result } from "../kernel";
import { createLatestRead } from "./latest-read";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("latest read ownership", () => {
  it.each([
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ])("the third invocation wins for completion order %j", async (a, b, c) => {
    const requests = [0, 1, 2].map(() => deferred<Result<number>>());
    const signals: AbortSignal[] = [];
    const reader = createLatestRead((index: number, signal) => {
      signals.push(signal);
      return requests[index].promise;
    });
    const pending = [0, 1, 2].map((index) => reader.run(index));
    for (const index of [a, b, c]) {
      requests[index].resolve(ok(index));
      await pending[index];
    }
    expect(reader.get()).toEqual({ state: "ready", value: 2 });
    expect(signals.map((signal) => signal.aborted)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("ignores an obsolete failure after the newer request succeeds", async () => {
    const first = deferred<Result<string>>();
    const reader = createLatestRead((old: boolean) =>
      old ? first.promise : Promise.resolve(ok("newer")),
    );
    const pending = reader.run(true);
    await reader.run(false);
    first.resolve(err(internal("old failure")));
    await pending;
    expect(reader.get()).toEqual({ state: "ready", value: "newer" });
  });

  it("keeps failed, empty, and unmeasured reads distinct and recovers", async () => {
    const reader = createLatestRead((result: Result<string[]>) =>
      Promise.resolve(result),
    );
    expect(reader.get()).toEqual({ state: "idle" });
    await reader.run(err(internal("bad")));
    expect(reader.get()).toMatchObject({
      state: "failed",
      previous: undefined,
    });
    await reader.run(ok(["accepted"]));
    await reader.run(err(internal("bad refresh")));
    expect(reader.get()).toMatchObject({
      state: "failed",
      previous: ["accepted"],
    });
    await reader.run(ok([]));
    expect(reader.get()).toEqual({ state: "ready", value: [] });
  });

  it("cancels on cleanup, ignores late results, and can reconnect after cleanup", async () => {
    const late = deferred<Result<string>>();
    const reader = createLatestRead((old: boolean) =>
      old ? late.promise : Promise.resolve(ok("current")),
    );
    const pending = reader.run(true);
    reader.cancel();
    late.resolve(ok("late"));
    await pending;
    expect(reader.get()).toEqual({ state: "idle" });
    await reader.run(false);
    expect(reader.get()).toEqual({ state: "ready", value: "current" });
    expect(reader.server()).toEqual({ state: "idle" });
  });
});
