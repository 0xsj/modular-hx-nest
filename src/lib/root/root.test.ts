import { describe, expect, it } from "vitest";
import { ok, type Failure } from "~/lib/kernel";
import { UNSERVED_ROUTE, type MemoryRoute } from "~/lib/http";
import { createRoot } from "./index";

const fail = (r: unknown) => (r as { error: Failure }).error;

describe("adapter choice — the one decision this tier makes", () => {
  it("no baseUrl means fixtures", () => {
    expect(createRoot().usingFixtures).toBe(true);
  });

  it("a baseUrl means the network", () => {
    expect(createRoot({ baseUrl: "https://api.test" }).usingFixtures).toBe(false);
  });

  it("the shipped table is empty, so every call is an unserved route", async () => {
    const f = fail(await createRoot().client.get("/anything"));
    expect(f.kind, "a fixture that was never asked must not answer like a server").toBe("internal");
    expect(f.type).toBe(UNSERVED_ROUTE);
  });

  it("a caller supplies its own routes rather than editing the tier", async () => {
    const routes: MemoryRoute[] = [{ method: "GET", pattern: /^\/x$/, handle: () => ok(1) }];
    const r = await createRoot({ routes }).client.get("/x");
    expect(r.ok && r.value).toBe(1);
  });
});

describe("correlation — one root per interaction", () => {
  it("mints one when none is given", () => {
    expect(createRoot().correlationId).not.toBe("");
  });

  it("two roots are two interactions", () => {
    expect(createRoot().correlationId).not.toBe(createRoot().correlationId);
  });

  it("carries the id the caller supplied", () => {
    expect(createRoot({ correlationId: "int-1" }).correlationId).toBe("int-1");
  });

  it("every failure through one root names the same interaction", async () => {
    const root = createRoot({ correlationId: "int-9" });
    const [a, b] = await Promise.all([root.client.get("/a"), root.client.get("/b")]);
    expect(
      [fail(a).correlationId, fail(b).correlationId],
      "a click that fans out into two requests is ONE interaction",
    ).toEqual(["int-9", "int-9"]);
  });
});

describe("chaos", () => {
  it("is off unless a plan is given", () => {
    expect(createRoot().underChaos).toBe(false);
  });

  it("reports itself when in force, so a surface can say so", async () => {
    const root = createRoot({ chaos: { rules: [["*", { fail: "forbidden" }]] } });
    expect(root.underChaos, "a forced failure that looks real wastes an afternoon").toBe(true);
    expect(fail(await root.client.get("/x")).kind).toBe("forbidden");
  });

  it("an empty plan is not chaos", () => {
    expect(createRoot({ chaos: { rules: [] } }).underChaos).toBe(false);
  });
});
