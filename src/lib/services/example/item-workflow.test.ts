import { describe, expect, it } from "vitest";
import { conflict, err, ok } from "../../kernel";
import { createMemoryClient } from "../../http";
import { createItemFixtures, initialItems } from "./item-workflow.fixtures";
import {
  findItemSave,
  readItem,
  updateItem,
  type ItemAttempt,
} from "./item-workflow";

function setup() {
  let data = initialItems("one");
  let blocked = false;
  const fixture = createItemFixtures({
    read: () => ok(structuredClone(data)),
    write: (next) => {
      if (blocked) return err(conflict("Storage full"));
      data = structuredClone(next);
      return ok(undefined);
    },
  });
  return {
    client: createMemoryClient({ routes: fixture.routes, latencyMs: 0 }),
    data: () => data,
    block: () => {
      blocked = true;
    },
    advance: fixture.advance,
  };
}
const attempt: ItemAttempt = {
  id: "api",
  expectedRevision: 1,
  operationId: "save-1",
  draft: { name: "Changed", host: "changed.example.com" },
};
describe("item workflow contract", () => {
  it("saves a revision and deduplicates an identical operation", async () => {
    const { client, data } = setup();
    const first = await updateItem(client, attempt),
      second = await updateItem(client, attempt);
    expect(first).toEqual(second);
    expect(first.ok && first.value.item.revision).toBe(2);
    expect(data().receipts).toHaveLength(1);
    expect((await readItem(client, "api")).unwrapOr(null)?.name).toBe(
      "Changed",
    );
    expect(
      (await findItemSave(client, "save-1")).unwrapOr(null)?.operationId,
    ).toBe("save-1");
  });
  it("rejects stale revisions and conflicting operation reuse without another commit", async () => {
    const { client, data } = setup();
    await updateItem(client, attempt);
    for (const value of [
      { ...attempt, operationId: "save-2" },
      { ...attempt, draft: { ...attempt.draft, name: "Different" } },
    ]) {
      const result = await updateItem(client, value);
      expect(!result.ok && result.error.kind).toBe("conflict");
    }
    expect(data().receipts).toHaveLength(1);
    expect(data().items[0].revision).toBe(2);
  });
  it("returns server field errors and missing-record errors distinctly", async () => {
    const { client } = setup();
    const duplicate = await updateItem(client, {
      ...attempt,
      draft: { ...attempt.draft, host: "jobs.example.com" },
    });
    expect(
      !duplicate.ok &&
        duplicate.error.kind === "invalid" &&
        duplicate.error.fields?.host,
    ).toBeTruthy();
    const missing = await readItem(client, "gone");
    expect(!missing.ok && missing.error.kind).toBe("not_found");
    expect(
      (await findItemSave(client, "never-sent")).unwrapOr("wrong"),
    ).toBeNull();
  });
  it("does not commit either the item or receipt if persistence refuses", async () => {
    const { client, data, block } = setup();
    block();
    expect((await updateItem(client, attempt)).ok).toBe(false);
    expect(data().items[0].revision).toBe(1);
    expect(data().receipts).toHaveLength(0);
  });
  it("rejects a well-shaped but unrelated receipt and a malformed detail", async () => {
    const client = createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "PUT",
          pattern: /.*/,
          handle: () =>
            ok({
              ...attempt,
              operationId: "wrong",
              item: { id: "api", ...attempt.draft, revision: 2 },
            }),
        },
        {
          method: "GET",
          pattern: /.*/,
          handle: () =>
            ok({ id: "api", name: "Name", host: "host", revision: "1" }),
        },
      ],
    });
    const save = await updateItem(client, attempt),
      read = await readItem(client, "api");
    expect(!save.ok && save.error.type).toBe("invalid_response");
    expect(!read.ok && read.error.type).toBe("invalid_response");
  });
});
