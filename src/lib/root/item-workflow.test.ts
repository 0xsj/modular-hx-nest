import { describe, expect, it, vi } from "vitest";
import { createMemoryStorage } from "../storage";
import { conflict, err } from "../kernel";
import { createItemWorkflow, type ItemCheckpoint } from "./item-workflow";

const signal = () => new AbortController().signal;
describe("durable item demo boundary", () => {
  it("is inert and restores committed records and lost-response receipts across roots", async () => {
    const storage = createMemoryStorage();
    const read = vi.spyOn(storage, "read");
    const first = createItemWorkflow("account", storage, 0);
    expect(read).not.toHaveBeenCalled();
    expect(first.initialize().ok).toBe(true);
    const item = (await first.detail("api", signal())).unwrapOr(null)!;
    const attempt = {
      id: item.id,
      expectedRevision: item.revision,
      operationId: "lost",
      draft: { name: "Changed", host: item.host },
    };
    first.setSaveMode("lost-response");
    expect((await first.save(attempt, signal())).ok).toBe(false);
    const second = createItemWorkflow("account", storage, 0);
    expect(second.initialize().ok).toBe(true);
    expect((await second.detail("api", signal())).unwrapOr(null)?.name).toBe(
      "Changed",
    );
    expect(
      (await second.find("lost", signal())).unwrapOr(null)?.item.revision,
    ).toBe(2);
    expect(JSON.stringify(first.diagnostics.get())).not.toContain("Changed");
  });
  it("keeps per-item drafts and pending attempts across navigation/reload and separates accounts", async () => {
    const storage = createMemoryStorage();
    const root = createItemWorkflow("one", storage, 0);
    root.initialize();
    const item = (await root.detail("api", signal())).unwrapOr(null)!;
    const baseline = { name: item.name, host: item.host };
    const checkpoint: ItemCheckpoint = {
      item,
      baseline,
      draft: { ...baseline, name: "Newer draft" },
      confirmed: null,
      attempt: {
        id: "api",
        expectedRevision: 1,
        operationId: "pending",
        draft: baseline,
      },
    };
    expect(root.checkpoint(checkpoint).ok).toBe(true);
    const restarted = createItemWorkflow("one", storage, 0);
    restarted.initialize();
    expect(restarted.loadDraft("api").unwrapOr(null)).toEqual(checkpoint);
    const other = createItemWorkflow("two", storage, 0);
    other.initialize();
    expect(other.loadDraft("api").unwrapOr("wrong")).toBeNull();
  });
  it("does not seed over unreadable or newer storage, and missing demo data is not terminal absence", async () => {
    for (const raw of ["broken", JSON.stringify({ version: 99, value: {} })]) {
      const storage = createMemoryStorage();
      storage.write("flover.cookbook.items.a:data", raw);
      const root = createItemWorkflow("a", storage, 0);
      expect(root.initialize().ok).toBe(false);
      expect(storage.read("flover.cookbook.items.a:data").unwrapOr(null)).toBe(
        raw,
      );
    }
    const storage = createMemoryStorage();
    const root = createItemWorkflow("a", storage, 0);
    root.initialize();
    storage.remove("flover.cookbook.items.a:data");
    const receipt = await root.find("unknown", signal());
    expect(receipt.ok).toBe(false);
  });
  it("never reports a failed receipt lookup as absence", async () => {
    const root = createItemWorkflow("a", createMemoryStorage(), 0);
    root.initialize();
    root.setChecksFail(true);
    expect((await root.find("unknown", signal())).ok).toBe(false);
    root.setChecksFail(false);
    expect((await root.find("unknown", signal())).unwrapOr("wrong")).toBeNull();
  });
  it("checkpoint refusal preserves the prior durable document", async () => {
    const storage = createMemoryStorage();
    const root = createItemWorkflow("a", storage, 0);
    root.initialize();
    const item = (await root.detail("api", signal())).unwrapOr(null)!;
    const baseline = { name: item.name, host: item.host };
    root.checkpoint({
      item,
      draft: baseline,
      baseline,
      confirmed: null,
      attempt: null,
    });
    const before = storage.read("flover.cookbook.items.a:drafts");
    vi.spyOn(storage, "write").mockImplementation(() => err(conflict("Full")));
    expect(
      root.checkpoint({
        item,
        draft: { ...baseline, name: "Keep me" },
        baseline,
        confirmed: null,
        attempt: null,
      }).ok,
    ).toBe(false);
    expect(storage.read("flover.cookbook.items.a:drafts")).toEqual(before);
  });
});
