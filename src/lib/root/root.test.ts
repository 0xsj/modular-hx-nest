import { describe, expect, it, vi } from "vitest";
import { ok } from "../kernel";
import type { MemoryRoute } from "../http";
import { createRoot } from ".";

const routes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/thing$/,
    handle: (req) => ok({ seenBy: req.correlationId }),
  },
];

describe("it picks the adapter, and it is the only thing that does", () => {
  it("uses fixtures when there is no base url", async () => {
    const root = createRoot({ routes });
    expect(root.usingFixtures("session")).toBe(true);
    expect((await root.clientFor("session").get("/thing")).ok).toBe(true);
  });

  it("uses the network when there is one", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ ok: 1 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const root = createRoot({ baseUrl: "https://api.test" });
    expect(root.usingFixtures("session")).toBe(false);
    expect((await root.clientFor("session").get("/thing")).ok).toBe(true);
    vi.unstubAllGlobals();
  });

  it("with no fixtures at all, a call is an unserved route — not a 404", async () => {
    const r = await createRoot().clientFor("session").get("/anything");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("internal"); // never not_found
      expect(r.error.type).toBe("unserved_route");
    }
  });
});

describe("one root, one interaction", () => {
  it("every call through a root carries the same correlation id", async () => {
    const root = createRoot({ routes });
    const a = await root.clientFor("session").get<{ seenBy: string }>("/thing");
    const b = await root.clientFor("session").get<{ seenBy: string }>("/thing");
    expect(a.ok && b.ok && a.value.seenBy).toBe(root.correlationId);
    expect(a.ok && b.ok && b.value.seenBy).toBe(root.correlationId);
  });

  it("two roots are two interactions", () => {
    expect(createRoot().correlationId).not.toBe(createRoot().correlationId);
  });

  it("and a caller may supply one, to join an interaction already under way", () => {
    expect(createRoot({ correlationId: "given" }).correlationId).toBe("given");
  });

  it("a failure names the interaction, which is the point of all of it", async () => {
    const root = createRoot();
    const r = await root.clientFor("session").get("/nope");
    if (!r.ok) expect(r.error.correlationId).toBe(root.correlationId);
  });
});

describe("chaos composes here and nowhere else", () => {
  it("reports when a plan is in force", () => {
    expect(createRoot({ routes }).underChaos).toBe(false);
    expect(
      createRoot({ routes, chaos: { rules: [["*", { fail: "forbidden" }]] } })
        .underChaos,
    ).toBe(true);
  });

  it("a plan reaches the real client", async () => {
    const root = createRoot({
      routes,
      chaos: { rules: [["GET /thing", { fail: "forbidden" }]] },
    });
    const r = await root.clientFor("session").get("/thing");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("forbidden");
  });

  it("forced EMPTINESS is a success, which is the branch fixtures hide", async () => {
    const root = createRoot({
      routes,
      chaos: { rules: [["GET /thing", { empty: "list" }]] },
    });
    const r = await root.clientFor("session").get("/thing");
    expect(r.ok && r.value).toEqual([]);
  });

  it("a FORCED failure still names its interaction", async () => {
    // The chaos wrapper manufactures the failure itself and returns before any
    // adapter runs, so nothing downstream can attach the id. It must do it.
    const root = createRoot({
      routes,
      chaos: { rules: [["*", { fail: "conflict" }]] },
    });
    const r = await root.clientFor("session").get("/thing");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.correlationId).toBe(root.correlationId);
  });

  it("is inert in production, so a plan cannot reach a live user", () => {
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    expect(
      createRoot({ routes, chaos: { rules: [["*", { fail: "internal" }]] } })
        .underChaos,
    ).toBe(false);
    vi.stubEnv("NODE_ENV", before ?? "test");
  });
});

describe("a backend graduates one domain at a time", () => {
  const routes: MemoryRoute[] = [
    {
      method: "GET",
      pattern: /^\/thing$/,
      handle: () => ok({ from: "fixture" }),
    },
  ];

  it("no base url means fixtures, whatever the served list says", async () => {
    const root = createRoot({
      routes,
      served: ["session", "ledger"],
      latencyMs: 0,
    });
    expect(root.usingFixtures("session")).toBe(true);
    expect(root.allFixtures).toBe(true);
  });

  it("a base url with no list serves everything — the obvious thing", async () => {
    // The trap avoided: `served` defaulting to empty would mean a configured
    // backend that is silently never called.
    const root = createRoot({ baseUrl: "https://api.test" });
    expect(root.usingFixtures("session")).toBe(false);
    expect(root.usingFixtures("ledger")).toBe(false);
    expect(root.allFixtures).toBe(false);
  });

  it("a list splits them, which is the whole point", async () => {
    const root = createRoot({
      baseUrl: "https://api.test",
      served: ["session"],
      routes,
      latencyMs: 0,
    });
    expect(root.usingFixtures("session")).toBe(false);
    expect(root.usingFixtures("ledger")).toBe(true);

    // And the unserved domain really does reach the fixture, not the network.
    const r = await root.clientFor("ledger").get<{ from: string }>("/thing");
    expect(r.ok && r.value.from).toBe("fixture");
  });

  it("every domain shares one correlation id, however it is served", async () => {
    // The split must not cost the thing the root exists for.
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const root = createRoot({
      baseUrl: "https://api.test",
      served: ["session"],
      routes,
      latencyMs: 0,
      correlationId: "cid-shared",
    });
    const fixture = await root.clientFor("ledger").get("/nope");
    expect(!fixture.ok && fixture.error.correlationId).toBe("cid-shared");
    expect(root.correlationId).toBe("cid-shared");
    vi.unstubAllGlobals();
  });

  it("an empty list is a base url deliberately unused", async () => {
    const root = createRoot({
      baseUrl: "https://api.test",
      served: [],
      routes,
      latencyMs: 0,
    });
    expect(root.usingFixtures("session")).toBe(true);
    expect(root.allFixtures).toBe(true);
  });
});
