import { createSequenceClient, type SequenceStep } from "../chaos";
import { createMemoryDiagnostics, createTrace } from "../diagnostics";
import {
  createMemoryClient,
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
  withDiagnostics,
  type HttpClient,
} from "../http";
import {
  err,
  internal,
  invalid,
  ok,
  timeout,
  unavailable,
  type Result,
} from "../kernel";
import {
  createBrowserStorage,
  createDocument,
  type StoragePort,
} from "../storage";
import { listItems, type NewItem } from "../services/example";
import {
  findItemSave,
  readEditableItem,
  readItem,
  readItemAttempt,
  readItemDraft,
  readItemReceipt,
  sameItemDraft,
  updateItem,
  type EditableItem,
  type ItemAttempt,
  type ItemReceipt,
} from "../services/example/item-workflow";
import {
  createItemFixtures,
  decodeItemDatabase,
  initialItems,
  type ItemDatabase,
} from "../services/example/item-workflow.fixtures";

export type ItemCheckpoint = {
  item: EditableItem;
  draft: NewItem;
  baseline: NewItem;
  confirmed: ItemReceipt | null;
  attempt: ItemAttempt | null;
};
type Checkpoints = { generation: string; entries: ItemCheckpoint[] };
export type ItemReadMode = "success" | "unavailable" | "malformed";
export type ItemSaveMode =
  | "success"
  | "refused"
  | "conflict"
  | "lost-response"
  | "not-delivered"
  | "held";
const decodeCheckpoints = responseDecoder(
  "item draft checkpoints",
  (raw): Checkpoints | undefined => {
    const value = responseObject(raw);
    const entries = responseArray((raw): ItemCheckpoint | undefined => {
      const v = responseObject(raw),
        item = readEditableItem(v?.item),
        draft = readItemDraft(v?.draft),
        baseline = readItemDraft(v?.baseline);
      const confirmed =
        v?.confirmed === null ? null : readItemReceipt(v?.confirmed);
      const attempt = v?.attempt === null ? null : readItemAttempt(v?.attempt);
      if (
        !item ||
        !draft ||
        !baseline ||
        confirmed === undefined ||
        attempt === undefined ||
        (confirmed &&
          (confirmed.id !== item.id ||
            !sameItemDraft(baseline, confirmed.draft))) ||
        (attempt &&
          (attempt.id !== item.id ||
            attempt.expectedRevision !==
              (confirmed?.item.revision ?? item.revision)))
      )
        return undefined;
      return { item, draft, baseline, confirmed, attempt };
    })(value?.entries);
    if (
      !value ||
      !responseText(value.generation) ||
      !entries ||
      new Set(entries.map((entry) => entry.item.id)).size !== entries.length
    )
      return undefined;
    return { generation: value.generation, entries };
  },
);
const missing = () =>
  internal(
    "The demo data and draft checkpoints no longer agree. Export any visible edits, then reset this demo explicitly.",
    { type: "demo_state_missing" },
  );

/** Isolated tab-local cookbook composition. Construction performs no IO.
 * Both documents use an injected storage port, so tests need no browser.
 * No production application client or endpoint configuration reaches this root. */
export function createItemWorkflow(
  accountId: string,
  storage: StoragePort = createBrowserStorage("session"),
  latencyMs = 220,
  recipe: "items" | "session" = "items",
) {
  const namespace = `flover.cookbook.${recipe}.${accountId}`;
  const database = createDocument(storage, namespace, {
    key: "data",
    version: 1,
    decode: decodeItemDatabase,
  });
  const drafts = createDocument(storage, namespace, {
    key: "drafts",
    version: 1,
    decode: decodeCheckpoints,
  });
  const diagnostics = createMemoryDiagnostics({ capacity: 200 });
  const active = new Set<ReturnType<typeof createSequenceClient>>();
  let generation: string | undefined;
  let resetting = false;
  let heldSaves = 0;
  let readMode: ItemReadMode = "success",
    saveMode: ItemSaveMode = "success",
    checksFail = false;
  function readData(): Result<ItemDatabase> {
    const value = database.read();
    if (!value.ok) return err(value.error);
    return value.value.state === "found" &&
      value.value.value.generation === generation
      ? ok(value.value.value)
      : err(missing());
  }
  const fixtures = createItemFixtures({
    read: readData,
    write: database.write,
  });
  async function call<T>(
    operation: string,
    request: string,
    effect: SequenceStep["effect"] | undefined,
    stage: "operation" | "recovery",
    work: (
      client: HttpClient,
      trace: ReturnType<typeof createTrace>,
    ) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    const trace = createTrace(diagnostics.port, {
      operation,
      correlationId: crypto.randomUUID(),
    });
    const sequence = createSequenceClient(
      createMemoryClient({
        routes: fixtures.routes,
        latencyMs,
        getCorrelationId: () => trace.correlationId,
      }),
      effect ? [{ request, effect }] : [],
    );
    active.add(sequence);
    try {
      return await trace.run(stage, () =>
        work(withDiagnostics(sequence.client), trace),
      );
    } finally {
      active.delete(sequence);
      sequence.dispose();
    }
  }
  const heldListeners = new Set<() => void>();
  const notifyHeld = () => {
    for (const listener of heldListeners) listener();
  };
  const readEffect = () =>
    readMode === "unavailable"
      ? {
          kind: "fail" as const,
          failure: unavailable(
            "The item source is temporarily unavailable. Your last accepted data is still available.",
          ),
        }
      : readMode === "malformed"
        ? { kind: "reply" as const, value: { unexpected: true } }
        : undefined;
  return {
    diagnostics,
    isResetting: () => resetting,
    isHolding: () => heldSaves > 0,
    subscribeHeld(listener: () => void) {
      heldListeners.add(listener);
      return () => {
        heldListeners.delete(listener);
      };
    },
    initialize(): Result<void> {
      const data = database.read(),
        saved = drafts.read();
      if (!data.ok) return err(data.error);
      if (!saved.ok) return err(saved.error);
      if (data.value.state === "missing") {
        if (saved.value.state === "found") return err(missing());
        const seed = initialItems(crypto.randomUUID());
        const written = database.write(seed);
        if (!written.ok) return written;
        generation = seed.generation;
      } else generation = data.value.value.generation;
      if (
        saved.value.state === "found" &&
        saved.value.value.generation !== generation
      )
        return err(missing());
      return ok(undefined);
    },
    reset(): Result<void> {
      const clearedDrafts = drafts.remove();
      if (!clearedDrafts.ok) return clearedDrafts;
      const clearedData = database.remove();
      if (!clearedData.ok) return clearedData;
      resetting = true;
      generation = undefined;
      diagnostics.clear();
      return ok(undefined);
    },
    loadDraft(id: string): Result<ItemCheckpoint | null> {
      const saved = drafts.read();
      if (!saved.ok) return err(saved.error);
      if (saved.value.state === "missing") return ok(null);
      if (saved.value.value.generation !== generation) return err(missing());
      return ok(
        saved.value.value.entries.find((entry) => entry.item.id === id) ?? null,
      );
    },
    checkpoint(entry: ItemCheckpoint): Result<void> {
      if (!generation) return err(missing());
      const data = readData();
      if (!data.ok) return err(data.error);
      const saved = drafts.read();
      if (!saved.ok) return err(saved.error);
      const entries =
        saved.value.state === "missing" ? [] : saved.value.value.entries;
      if (
        saved.value.state === "found" &&
        saved.value.value.generation !== generation
      )
        return err(missing());
      return drafts.write({
        generation,
        entries: [
          ...entries.filter((value) => value.item.id !== entry.item.id),
          entry,
        ],
      });
    },
    setReadMode(mode: ItemReadMode) {
      readMode = mode;
    },
    setSaveMode(mode: ItemSaveMode) {
      saveMode = mode;
    },
    setChecksFail(value: boolean) {
      checksFail = value;
    },
    list(signal: AbortSignal) {
      return call(
        "items.list",
        "GET /items",
        readEffect(),
        "operation",
        (client, trace) => listItems(client, "workflow", { signal, trace }),
      );
    },
    detail(id: string, signal: AbortSignal) {
      return call(
        "items.detail",
        `GET /items/${encodeURIComponent(id)}`,
        readEffect(),
        "operation",
        (client, trace) => readItem(client, id, { signal, trace }),
      );
    },
    save(attempt: ItemAttempt, signal: AbortSignal) {
      const effects: Record<ItemSaveMode, SequenceStep["effect"] | undefined> =
        {
          success: undefined,
          conflict: undefined,
          refused: {
            kind: "fail",
            failure: invalid("The simulated server refused this name.", {
              name: "Choose another name or turn off the refusal scenario.",
            }),
          },
          "lost-response": {
            kind: "lose-response",
            failure: timeout(
              "The save response did not arrive. Check whether the item was saved.",
            ),
          },
          "not-delivered": {
            kind: "fail",
            failure: unavailable(
              "The request did not reach the simulated server.",
            ),
          },
          held: { kind: "hold-response", gate: "save-response" },
        };
      const mode = saveMode;
      if (mode === "held") {
        heldSaves++;
        notifyHeld();
      }
      return call(
        "items.save",
        `PUT /items/${encodeURIComponent(attempt.id)}`,
        effects[mode],
        "operation",
        async (client, trace) => {
          if (mode === "conflict") {
            const advanced = fixtures.advance(attempt.id);
            if (!advanced.ok) return err(advanced.error);
          }
          return updateItem(client, attempt, { signal, trace });
        },
      ).finally(() => {
        if (mode === "held") {
          heldSaves--;
          notifyHeld();
        }
      });
    },
    find(id: string, signal: AbortSignal) {
      return call(
        "items.reconcile",
        `GET /item-saves/${encodeURIComponent(id)}`,
        checksFail
          ? {
              kind: "fail",
              failure: unavailable(
                "The save receipt could not be checked. Keep your draft and try checking again.",
              ),
            }
          : undefined,
        "recovery",
        (client, trace) => findItemSave(client, id, { signal, trace }),
      );
    },
    release() {
      for (const sequence of active) sequence.release("save-response");
    },
    dispose() {
      for (const sequence of active) sequence.dispose();
      active.clear();
      heldListeners.clear();
    },
  };
}
export type ItemWorkflow = ReturnType<typeof createItemWorkflow>;
