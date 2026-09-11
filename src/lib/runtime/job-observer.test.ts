import { describe, expect, it, vi } from "vitest";
import { err, ok, timeout, type Result } from "../kernel";
import { createJobExample } from "../root/jobs";
import { decodeJob, type Job } from "../services/jobs";
import { createJobObserver, type JobPort } from "./job-observer";
const queued: Job = { id: "a", kind: "export", revision: 1, state: "queued" };
const running: Job = {
  ...queued,
  revision: 2,
  state: "running",
  progress: null,
};
const completed: Job = {
  ...queued,
  revision: 3,
  state: "completed",
  summary: "Done",
};

describe("job observer contract (implementation-visible)", () => {
  it.each([undefined, -1, 101, NaN, "50"])(
    "rejects malformed progress %s",
    (progress) => {
      expect(decodeJob({ ...running, progress }).ok).toBe(false);
    },
  );
  it("keeps unknown progress distinct from zero and checks completed/failed detail", () => {
    expect(decodeJob(running).unwrapOr(null)).toEqual(running);
    expect(decodeJob({ ...running, progress: 0 }).unwrapOr(null)).toMatchObject(
      { progress: 0 },
    );
    expect(decodeJob({ ...completed, summary: "" }).ok).toBe(false);
    expect(decodeJob({ ...queued, state: "failed" }).ok).toBe(false);
  });
  it("stops local observation without sending cancellation and catches up on resume", async () => {
    let current: Job = queued;
    const port = { read: vi.fn(async () => ok(current)), cancel: vi.fn() };
    const model = createJobObserver("a", port);
    await model.start();
    model.stop();
    current = completed;
    await model.hint();
    expect(port.read).toHaveBeenCalledTimes(1);
    expect(port.cancel).not.toHaveBeenCalled();
    expect(model.get().job).toEqual(queued);
    await model.start();
    expect(model.get().job).toEqual(completed);
  });
  it("ignores late responses after stop and rejects snapshots older than the last accepted revision", async () => {
    let finish!: (value: Result<Job>) => void;
    const port: JobPort = {
      read: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      cancel: vi.fn(),
    };
    const model = createJobObserver("a", port);
    const pending = model.start();
    model.stop();
    finish(ok(running));
    await pending;
    expect(model.get().job).toBeNull();
    const restart = model.start();
    finish(ok(running));
    await restart;
    const stale = model.refresh();
    finish(ok(queued));
    await stale;
    expect(model.get().job).toEqual(running);
    expect(model.get().failure?.type).toBe("invalid_response");
  });
  it("rejects another job, state regression, conflicting equal revisions and reopening a terminal job", async () => {
    let next: Job = running;
    const model = createJobObserver("a", {
      read: async () => ok(next),
      cancel: vi.fn(),
    });
    await model.start();
    for (next of [
      { ...running, id: "b" },
      { ...queued, revision: 4 },
      { ...running, progress: 50 },
    ]) {
      await model.refresh();
      expect(model.get().job).toEqual(running);
      expect(model.get().failure?.type).toBe("invalid_response");
    }
    next = completed;
    await model.refresh();
    next = { ...running, revision: 4 };
    await model.refresh();
    expect(model.get().job).toEqual(completed);
  });
  it("records accepted cancellation without inventing a canceled job", async () => {
    const port = {
      read: async () => ok(running),
      cancel: vi.fn(async () => ok({ id: "a", accepted: true })),
    };
    const model = createJobObserver("a", port);
    await model.start();
    await model.cancel();
    expect(model.get().cancellation).toBe("accepted");
    expect(model.get().job?.state).toBe("running");
    await model.cancel();
    expect(port.cancel).toHaveBeenCalledTimes(1);
  });
  it("does not convert a lost cancellation response to canceled, or retry the command", async () => {
    const port = {
      read: async () => ok(running),
      cancel: vi.fn(async () => err(timeout("Lost"))),
    };
    const model = createJobObserver("a", port);
    await model.start();
    await model.cancel();
    await model.cancel();
    expect(model.get().cancellation).toBe("unknown");
    expect(model.get().job).toEqual(running);
    expect(port.cancel).toHaveBeenCalledTimes(1);
  });
  it("simulates lost acknowledgment and completion winning the cancellation race", async () => {
    for (const mode of ["lost-response", "complete-first"] as const) {
      const root = createJobExample("import", 0);
      root.setCancelMode(mode);
      const model = createJobObserver(root.id, root);
      await model.start();
      await model.cancel();
      if (mode === "complete-first") {
        expect(model.get().cancellation).toBe("too-late");
        expect(model.get().job?.state).toBe("completed");
      } else {
        expect(model.get().cancellation).toBe("unknown");
        expect(model.get().job?.state).toBe("queued");
        root.advance();
        await model.refresh();
        expect(model.get().job?.state).toBe("canceled");
      }
    }
  });
  it("continues server work offline and recovers from the last snapshot on reconnect", async () => {
    const root = createJobExample("export", 0),
      model = createJobObserver(root.id, root);
    await model.start();
    root.connect(false);
    root.advance();
    await model.refresh();
    expect(model.get().failure?.kind).toBe("unavailable");
    expect(model.get().job?.state).toBe("queued");
    root.connect(true);
    await model.refresh();
    expect(model.get().job).toMatchObject({ state: "running", progress: null });
  });
});
