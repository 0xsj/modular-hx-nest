import { describe, expect, it, vi } from "vitest";
import {
  narrow,
  optional,
  absentWhenType,
  err,
  notFound,
  type Failure,
} from "../kernel";
import {
  CORRELATION_HEADER,
  createFetchClient,
  createMemoryClient,
  type MemoryRoute,
} from ".";

/* Ordinary tests, written alongside the seam. The barriered spec suite predates
 * correlation entirely and does not cover it — see ADR 0003. */

const CID = "int-8f2a";

describe("the header is sent", () => {
  it("goes out on every request when an id is supplied", async () => {
    const seen: RequestInit[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      seen.push(init);
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const client = createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => CID,
    });
    await client.get("/a");
    await client.post("/b", { body: { x: 1 } });
    vi.unstubAllGlobals();

    expect(seen).toHaveLength(2);
    for (const init of seen) {
      expect((init.headers as Record<string, string>)[CORRELATION_HEADER]).toBe(
        CID,
      );
    }
  });

  it("sends nothing at all when the hook is absent or returns undefined", async () => {
    const seen: RequestInit[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      seen.push(init);
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    await createFetchClient({ baseUrl: "https://api.test" }).get("/a");
    await createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => undefined,
    }).get("/b");
    vi.unstubAllGlobals();
    for (const init of seen) {
      expect(
        (init.headers as Record<string, string>)[CORRELATION_HEADER],
      ).toBeUndefined();
    }
  });

  it("is read LAZILY, so a new interaction is picked up without a new client", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      seen.push((init.headers as Record<string, string>)[CORRELATION_HEADER]);
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    let current = "first";
    const client = createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => current,
    });
    await client.get("/a");
    current = "second";
    await client.get("/b");
    vi.unstubAllGlobals();
    expect(seen).toEqual(["first", "second"]);
  });
});

describe("a failure can always name its interaction", () => {
  const stub = (init: ResponseInit) =>
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ message: "no" }), init),
    );

  it("carries what we SENT when the server ignores the header", async () => {
    stub({ status: 500, headers: { "content-type": "application/json" } });
    const r = await createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => CID,
    }).get("/a");
    vi.unstubAllGlobals();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.correlationId).toBe(CID);
  });

  it("prefers the server's echo, because the server saw the request", async () => {
    stub({
      status: 500,
      headers: {
        "content-type": "application/json",
        [CORRELATION_HEADER]: "server-said",
      },
    });
    const r = await createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => CID,
    }).get("/a");
    vi.unstubAllGlobals();
    if (!r.ok) expect(r.error.correlationId).toBe("server-said");
  });

  it("survives a transport failure, which is when it matters most", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("socket hung up");
    });
    const r = await createFetchClient({
      baseUrl: "https://api.test",
      getCorrelationId: () => CID,
    }).get("/a");
    vi.unstubAllGlobals();
    if (!r.ok) {
      expect(r.error.kind).toBe("unavailable");
      expect(r.error.correlationId).toBe(CID);
    }
  });
});

describe("the memory adapter is indistinguishable", () => {
  const routes: MemoryRoute[] = [
    {
      method: "GET",
      pattern: /^\/echo$/,
      handle: (req) =>
        err(notFound(String(req.correlationId), { status: 404 })),
    },
    {
      method: "GET",
      pattern: /^\/plain$/,
      handle: () => err(notFound("gone", { status: 404 })),
    },
  ];
  const client = createMemoryClient({
    routes,
    latencyMs: 0,
    getCorrelationId: () => CID,
  });

  it("shows a route the id the caller would have sent", async () => {
    const r = await client.get("/echo");
    if (!r.ok) expect(r.error.message).toBe(CID);
  });

  it("attaches it to a route's failure that did not set one", async () => {
    const r = await client.get("/plain");
    if (!r.ok) expect(r.error.correlationId).toBe(CID);
  });

  it("attaches it to an unserved route too", async () => {
    const r = await client.get("/nope");
    if (!r.ok) {
      expect(r.error.kind).toBe("internal");
      expect(r.error.correlationId).toBe(CID);
    }
  });
});

describe("the thread is not cut by the folds", () => {
  const withCid: Failure = {
    kind: "conflict",
    message: "moved",
    correlationId: CID,
    status: 409,
  };

  it("narrow preserves it when folding an unpromised domain kind", () => {
    const folded = narrow("not_found")(withCid);
    expect(folded.kind).toBe("internal");
    expect(folded.correlationId).toBe(CID);
    expect(folded.cause?.correlationId).toBe(CID);
  });

  it("optional preserves it when folding an unrecognised not_found", async () => {
    const r = await optional(
      err<string>({ kind: "not_found", message: "gone", correlationId: CID }),
      absentWhenType("legitimately_absent"),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("internal");
      expect(r.error.correlationId).toBe(CID);
    }
  });
});
