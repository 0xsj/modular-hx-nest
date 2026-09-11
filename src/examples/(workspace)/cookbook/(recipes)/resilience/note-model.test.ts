import { describe, expect, it, vi } from "vitest";
import {
  err,
  invalid,
  ok,
  timeout,
  unavailable,
  type Result,
} from "~/lib/kernel";
import {
  createNoteExample,
  createRaceExample,
  readResponseExample,
} from "~/lib/root/resilience";
import { createMemoryClient } from "~/lib/http";
import { createNoteFixtures } from "~/lib/services/example/note.fixtures";
import { findNoteSave, saveNote } from "~/lib/services/example/note.api";
import type {
  NoteAttempt,
  NoteReceipt,
} from "~/lib/services/example/note.types";
import { createNoteModel } from "./note-model";
import { createRaceModel } from "./race-model";

const draft = {
  title: "My title",
  body: "Every character stays.\nEven this line.",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("draft recovery guarantees", () => {
  it("preserves the draft after a definite refusal and permits a corrected save", async () => {
    const example = createNoteExample();
    example.setSaveMode("refused");
    const model = createNoteModel(example, draft);
    await model.save();
    expect(model.get()).toMatchObject({
      draft,
      confirmed: null,
      phase: { state: "refused" },
    });
    expect(example.committed()).toBe(0);
    example.setSaveMode("success");
    await model.save();
    expect(model.get()).toMatchObject({
      draft,
      confirmed: { draft, revision: 1 },
      phase: { state: "ready" },
    });
  });

  it("lost acknowledgement commits once, blocks further writes, and reconciles without writing", async () => {
    const example = createNoteExample();
    const save = vi.fn(example.save);
    const model = createNoteModel(
      { ...example, save },
      draft,
      () => "original-operation",
    );
    await model.save();
    expect(example.committed()).toBe(1);
    expect(model.get()).toMatchObject({
      draft,
      confirmed: null,
      phase: {
        state: "unknown",
        attempt: { operationId: "original-operation", draft },
      },
    });
    await model.save();
    expect(save).toHaveBeenCalledTimes(1);
    await model.check();
    expect(example.committed()).toBe(1);
    expect(model.get()).toMatchObject({
      draft,
      confirmed: { draft, revision: 1 },
      phase: { state: "ready" },
    });
  });

  it("failed reconciliation remains unknown and retains the original operation", async () => {
    const example = createNoteExample();
    const model = createNoteModel(example, draft, () => "original");
    await model.save();
    example.failChecks(true);
    await model.check();
    expect(model.get()).toMatchObject({
      draft,
      confirmed: null,
      phase: {
        state: "unknown",
        attempt: { operationId: "original" },
        failure: { kind: "unavailable" },
      },
    });
    example.failChecks(false);
    await model.check();
    expect(model.get().confirmed?.operationId).toBe("original");
    expect(example.committed()).toBe(1);
  });

  it("terminal absence permits a new attempt with a new id and the current draft", async () => {
    const example = createNoteExample();
    example.setSaveMode("not-delivered");
    let sequence = 0;
    const model = createNoteModel(example, draft, () => `op-${++sequence}`);
    await model.save();
    expect(model.get().phase.state).toBe("unknown");
    expect(example.committed()).toBe(0);
    await model.check();
    expect(model.get().phase.state).toBe("not-recorded");
    example.setSaveMode("success");
    await model.save();
    expect(model.get().confirmed?.operationId).toBe("op-2");
    expect(example.committed()).toBe(1);
  });

  it("prevents overlapping saves and does not overwrite edits made while saving", async () => {
    const pending = deferred<Result<NoteReceipt>>();
    const save = vi.fn(() => pending.promise);
    const model = createNoteModel(
      { save, find: async () => ok(null) },
      draft,
      () => "captured",
    );
    const first = model.save();
    await model.save();
    model.edit({ ...draft, title: "Newer title" });
    pending.resolve(ok({ operationId: "captured", draft, revision: 1 }));
    await first;
    expect(save).toHaveBeenCalledTimes(1);
    expect(model.get()).toMatchObject({
      draft: { title: "Newer title" },
      confirmed: { draft },
      phase: { state: "ready" },
    });
  });

  it("allows editing during a check and deduplicates repeated check activations", async () => {
    const pending = deferred<Result<NoteReceipt | null>>();
    const find = vi.fn(() => pending.promise);
    const model = createNoteModel(
      { save: async () => err(timeout("lost")), find },
      draft,
      () => "captured",
    );
    await model.save();
    const first = model.check();
    await model.check();
    model.edit({ ...draft, body: "Newer body" });
    pending.resolve(ok({ operationId: "captured", draft, revision: 1 }));
    await first;
    expect(find).toHaveBeenCalledTimes(1);
    expect(model.get()).toMatchObject({
      draft: { body: "Newer body" },
      confirmed: { draft },
    });
  });

  it("does not mistake a malformed or unrelated receipt for confirmation", async () => {
    const model = createNoteModel(
      {
        save: async () => err(timeout("lost")),
        find: async () => ok({ operationId: "different", draft, revision: 1 }),
      },
      draft,
      () => "original",
    );
    await model.save();
    await model.check();
    expect(model.get()).toMatchObject({
      confirmed: null,
      phase: { state: "unknown", failure: { type: "invalid_response" } },
    });
  });

  it("cleanup aborts work without treating an interrupted write as a definite refusal", async () => {
    const pending = deferred<Result<NoteReceipt>>();
    let signal: AbortSignal | undefined;
    const model = createNoteModel(
      {
        save: (_attempt, active) => {
          signal = active;
          return pending.promise;
        },
        find: async () => err(unavailable("offline")),
      },
      draft,
      () => "original",
    );
    const active = model.save();
    model.cancel();
    expect(signal?.aborted).toBe(true);
    pending.resolve(ok({ operationId: "original", draft, revision: 1 }));
    await active;
    expect(model.get()).toMatchObject({
      draft,
      confirmed: null,
      phase: { state: "unknown", attempt: { operationId: "original" } },
    });
  });

  it("a local invalid title produces no commit", async () => {
    const example = createNoteExample();
    const model = createNoteModel(example, { title: " ", body: draft.body });
    await model.save();
    expect(model.get().phase.state).toBe("refused");
    expect(example.committed()).toBe(0);
  });
});

describe("the example backend's explicit receipt contract", () => {
  it("deduplicates an identical operation and refuses reuse with different content", async () => {
    const fixtures = createNoteFixtures();
    const client = createMemoryClient({
      routes: fixtures.routes,
      latencyMs: 0,
    });
    const attempt: NoteAttempt = { operationId: "same", draft };
    const first = await saveNote(client, attempt);
    const repeated = await saveNote(client, attempt);
    expect(first.unwrapOr(null)).toEqual(repeated.unwrapOr(null));
    expect(fixtures.committed()).toBe(1);
    const conflict = await saveNote(client, {
      ...attempt,
      draft: { ...draft, title: "different" },
    });
    expect(!conflict.ok && conflict.error.kind).toBe("conflict");
    expect((await findNoteSave(client, "same")).unwrapOr(null)).toEqual(
      first.unwrapOr(null),
    );
  });

  it("an arbitrary lookup refusal is not evidence of absence", async () => {
    const client = createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "GET",
          pattern: /.*/,
          handle: () => err(invalid("bad request", {})),
        },
      ],
    });
    expect((await findNoteSave(client, "id")).ok).toBe(false);
  });
});

it("replays the real out-of-order simulation without accepting the earlier result", async () => {
  const model = createRaceModel(createRaceExample);
  for (let i = 0; i < 2; i++) {
    await model.start();
    expect(model.phase.get()).toBe("waiting");
    await model.release();
    expect(model.reader.get()).toMatchObject({
      state: "ready",
      value: [{ id: "newer" }],
    });
    expect(model.phase.get()).toBe("complete");
  }
  model.cancel();
});

it("the malformed cookbook cases use the actual service decoder", async () => {
  for (const mode of ["malformed", "partial"] as const) {
    const result = await readResponseExample(
      mode,
      new AbortController().signal,
    );
    expect(!result.ok && result.error.type).toBe("invalid_response");
  }
});
