import { describe, expect, it, vi } from "vitest";
import { err, invalid, ok, timeout, unavailable, type Result } from "../kernel";
import { createSaveDraft, type DraftAttempt } from "./save-draft";

type Draft = { title: string };
type Attempt = DraftAttempt<Draft>;
type Receipt = Attempt & { revision: number };
const initial = { title: "Original" };
const options = {
  same: (a: Draft, b: Draft) => a.title === b.title,
  attempt: (draft: Draft, operationId: string) => ({ draft, operationId }),
  newId: () => "one",
};
const receipt = (attempt: Attempt): Receipt => ({ ...attempt, revision: 2 });
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("save draft contract", () => {
  it("is inert and separates current input from its saved baseline", async () => {
    const save = vi.fn(async (attempt: Attempt) => ok(receipt(attempt)));
    const model = createSaveDraft(
      { save, find: async () => ok(null) },
      initial,
      options,
    );
    expect(save).not.toHaveBeenCalled();
    model.edit({ title: "Edited" });
    expect(model.get().baseline).toEqual(initial);
    await model.save();
    expect(model.get().baseline).toEqual({ title: "Edited" });
    expect(model.get().phase.state).toBe("ready");
  });
  it("does not overwrite edits made while a save is pending", async () => {
    const held = deferred<Result<Receipt>>();
    const model = createSaveDraft(
      { save: () => held.promise, find: async () => ok(null) },
      initial,
      options,
    );
    const save = model.save();
    model.edit({ title: "Newer" });
    held.resolve(ok(receipt({ operationId: "one", draft: initial })));
    await save;
    expect(model.get().draft.title).toBe("Newer");
    expect(model.get().baseline.title).toBe("Original");
  });
  it("blocks duplicate and unresolved saves; failed checks cannot establish absence", async () => {
    const save = vi.fn(async () => err(timeout("Lost")));
    const find = vi.fn(async () => err(unavailable("Offline")));
    const model = createSaveDraft<Draft, Attempt, Receipt>(
      { save, find },
      initial,
      options,
    );
    await Promise.all([model.save(), model.save()]);
    await model.save();
    await model.check();
    await model.save();
    expect(save).toHaveBeenCalledTimes(1);
    expect(model.get().phase.state).toBe("unknown");
    expect(model.discard()).toBe(false);
  });
  it("keeps the submitted input with a refusal so field errors can follow their own value", async () => {
    const model = createSaveDraft<Draft, Attempt, Receipt>(
      {
        save: async () => err(invalid("Title", { title: "Required" })),
        find: async () => ok(null),
      },
      initial,
      options,
    );
    await model.save();
    expect(model.get().phase.state).toBe("refused");
    model.edit({ title: "Corrected" });
    expect(model.get().phase.state).toBe("refused");
    const phase = model.get().phase;
    expect(phase.state === "refused" && phase.submitted.draft.title).toBe(
      "Original",
    );
    expect(model.get().draft.title).toBe("Corrected");
  });
  it("reconciles only matching receipts and accepts terminal absence", async () => {
    let found: Receipt | null = {
      operationId: "other",
      draft: initial,
      revision: 2,
    };
    const model = createSaveDraft<Draft, Attempt, Receipt>(
      { save: async () => err(timeout("Lost")), find: async () => ok(found) },
      initial,
      options,
    );
    await model.save();
    await model.check();
    expect(model.get().phase.state).toBe("unknown");
    found = null;
    await model.check();
    expect(model.get().phase.state).toBe("not-recorded");
    expect(model.get().draft).toEqual(initial);
  });
  it("requires a checkpoint before invoking the write, and retrying persistence never saves", async () => {
    const save = vi.fn(async (attempt: Attempt) => ok(receipt(attempt)));
    let blocked = true;
    const model = createSaveDraft(
      { save, find: async () => ok(null) },
      initial,
      {
        ...options,
        persist: () =>
          blocked ? err(unavailable("Storage blocked")) : ok(undefined),
      },
    );
    model.edit({ title: "Keep me" });
    await model.save();
    expect(save).not.toHaveBeenCalled();
    expect(model.get().checkpointFailure).toBeDefined();
    expect(model.get().draft.title).toBe("Keep me");
    blocked = false;
    model.checkpoint();
    expect(save).not.toHaveBeenCalled();
    await model.save();
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("keeps server confirmation distinct from a failed confirmation checkpoint", async () => {
    const model = createSaveDraft(
      {
        save: async (a: Attempt) => ok(receipt(a)),
        find: async () => ok(null),
      },
      initial,
      {
        ...options,
        persist: (state) =>
          state.confirmed ? err(unavailable("Storage full")) : ok(undefined),
      },
    );
    await model.save();
    expect(model.get().confirmed?.revision).toBe(2);
    expect(model.get().phase.state).toBe("ready");
    expect(model.get().checkpointFailure).toBeDefined();
  });
  it("restores a checkpointed attempt as unknown and checks without resending", async () => {
    const attempt = { operationId: "one", draft: initial };
    const save = vi.fn(async (a: Attempt) => ok(receipt(a)));
    const model = createSaveDraft(
      { save, find: async () => ok(receipt(attempt)) },
      initial,
      {
        ...options,
        restored: {
          draft: { title: "Later" },
          baseline: initial,
          confirmed: null,
          attempt,
        },
      },
    );
    expect(model.get().phase.state).toBe("unknown");
    await model.save();
    await model.check();
    expect(save).not.toHaveBeenCalled();
    expect(model.get().draft.title).toBe("Later");
    expect(model.get().confirmed?.operationId).toBe("one");
  });
  it("cancellation retains the attempt and ignores obsolete completion", async () => {
    const held = deferred<Result<Receipt>>();
    const model = createSaveDraft(
      { save: () => held.promise, find: async () => ok(null) },
      initial,
      options,
    );
    const pending = model.save();
    model.cancel();
    held.resolve(ok(receipt({ operationId: "one", draft: initial })));
    await pending;
    expect(model.get().phase.state).toBe("unknown");
    expect(model.get().confirmed).toBeNull();
  });
});
