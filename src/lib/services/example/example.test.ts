import { describe, expect, it } from "vitest";
import { err, ok, notFound, rateLimited, conflict, invalid, type Failure } from "~/lib/kernel";
import { createMemoryClient, type MemoryRoute } from "~/lib/http";
import {
  NO_DEFAULT, createItem, findDefaultItem, getItem, itemPage, listItems, renameItem,
  type Item,
} from "./index";

const items: Item[] = [
  { id: "i1", name: "api", host: "api.example.com" },
  { id: "i2", name: "www", host: "www.example.com" },
];
const client = (routes: MemoryRoute[]) => createMemoryClient({ routes, latencyMs: 1 });
const fail = (r: { ok: boolean }) => (r as unknown as { error: Failure }).error;

describe("reads", () => {
  it("an empty list is a VALUE, not a failure", async () => {
    const r = await listItems(client([{ method: "GET", pattern: /^\/items$/, handle: () => ok([]) }]), "w");
    expect(r.ok, "a read that returned zero rows LOOKED").toBe(true);
    expect(r.ok && r.value).toEqual([]);
  });

  it("a read promises not_found and passes transport through untouched", async () => {
    const r = await getItem(
      client([{ method: "GET", pattern: /^\/items\/x$/, handle: () => err(rateLimited("slow down", 30)) }]),
      "x",
    );
    const f = fail(r);
    expect(f.kind, "a service may not narrow away a kind it does not control").toBe("rate_limited");
    expect((f as { retryAfter?: number }).retryAfter, "folding would have lost this").toBe(30);
  });

  it("an unpromised domain kind folds to internal, keeping the original", async () => {
    const r = await getItem(
      client([{ method: "GET", pattern: /^\/items\/x$/, handle: () => err(conflict("nope")) }]),
      "x",
    );
    expect(fail(r).kind, "a read never promised conflict").toBe("internal");
    expect(fail(r).cause?.kind).toBe("conflict");
  });
});

describe("findDefaultItem — the three states", () => {
  const route = (handle: MemoryRoute["handle"]): MemoryRoute => ({
    method: "GET", pattern: /^\/workspaces\/[^/]+\/default-item$/, handle,
  });

  it("a TAGGED 404 is emptiness — a success carrying null", async () => {
    const r = await findDefaultItem(
      client([route(() => err(notFound("none set", { status: 404, type: NO_DEFAULT })))]), "w");
    expect(r.ok).toBe(true);
    expect(r.ok && r.value, "looked and found nothing").toBeNull();
  });

  it("an UNTAGGED 404 is a fault, not emptiness", async () => {
    const r = await findDefaultItem(client([route(() => err(notFound("no such path")))]), "w");
    expect(r.ok, "a typo in an endpoint must not render as absence").toBe(false);
    expect(fail(r).kind).toBe("internal");
    expect(fail(r).cause?.kind).toBe("not_found");
  });

  it("a route nobody registered is a fault too", async () => {
    const r = await findDefaultItem(client([]), "w");
    expect(r.ok, "an unserved fixture route must never read as emptiness").toBe(false);
    expect(fail(r).kind).toBe("internal");
  });

  it("a present value is found", async () => {
    const r = await findDefaultItem(client([route(() => ok(items[0]))]), "w");
    expect(r.ok && r.value).toEqual(items[0]);
  });
});

describe("createItem — client validation is the server's shape", () => {
  const routes: MemoryRoute[] = [{ method: "POST", pattern: /^\/items$/, handle: () => ok(items[0]) }];

  it("refuses locally with the same kind and shape a server would send", async () => {
    const r = await createItem(client(routes), { name: " ", host: "not a host!" });
    const f = fail(r);
    expect(f.kind, "one branch in the form, not two").toBe("invalid");
    expect((f as { fields: Record<string, string> }).fields).toEqual({
      name: "A name is required.",
      host: "That is not a hostname.",
    });
  });

  it("does not call the transport when it refuses locally", async () => {
    let called = false;
    await createItem(client([{ method: "POST", pattern: /^\/items$/, handle: () => { called = true; return ok(items[0]); } }]),
      { name: "", host: "ok.example" });
    expect(called).toBe(false);
  });

  it("passes a valid input through", async () => {
    const r = await createItem(client(routes), { name: "api", host: "api.example.com" });
    expect(r.ok).toBe(true);
  });

  it("a server-side invalid keeps its fields", async () => {
    const r = await createItem(
      client([{ method: "POST", pattern: /^\/items$/, handle: () => err(invalid("taken", { host: "In use." })) }]),
      { name: "api", host: "api.example.com" });
    expect((fail(r) as { fields: Record<string, string> }).fields).toEqual({ host: "In use." });
  });
});

describe("composition", () => {
  const routes: MemoryRoute[] = [
    { method: "GET", pattern: /^\/items$/, handle: () => ok(items) },
    { method: "GET", pattern: /^\/items\/i1$/, handle: () => ok(items[0]) },
    { method: "PATCH", pattern: /^\/items\/i1$/, handle: (req) => ok({ ...items[0], name: (req.body as Item).name }) },
  ];

  it("independent — collects both values", async () => {
    const r = await itemPage(client(routes), "w", "i1");
    expect(r.ok && r.value.item).toEqual(items[0]);
    expect(r.ok && r.value.siblings).toHaveLength(2);
  });

  it("independent — returns the FIRST failure", async () => {
    const r = await itemPage(
      client([{ method: "GET", pattern: /^\/items\/i1$/, handle: () => err(notFound("gone")) },
              { method: "GET", pattern: /^\/items$/, handle: () => ok(items) }]), "w", "i1");
    expect(fail(r).kind).toBe("not_found");
  });

  it("dependent — step two uses step one's value", async () => {
    const r = await renameItem(client(routes), "i1", "renamed");
    expect(r.ok && r.value).toEqual({ id: "i1", name: "renamed", host: "api.example.com" });
  });

  it("dependent — step one failing skips step two", async () => {
    let patched = false;
    const r = await renameItem(client([
      { method: "GET", pattern: /^\/items\/i1$/, handle: () => err(notFound("gone")) },
      { method: "PATCH", pattern: /^\/items\/i1$/, handle: () => { patched = true; return ok(items[0]); } },
    ]), "i1", "x");
    expect(r.ok).toBe(false);
    expect(patched, "a dependent step must not run on a failed prerequisite").toBe(false);
  });
});
