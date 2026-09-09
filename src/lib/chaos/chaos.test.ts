import { describe, expect, it, vi } from "vitest";
import { ok, type Failure, type Result } from "~/lib/kernel";
import type { HttpClient, RequestOptions } from "~/lib/http";
import { matches, parsePlan, rng, withChaos, type Plan } from "./index";

const stub = (calls: string[] = []): HttpClient => {
  const request = async <T>(m: string, p: string, _o?: RequestOptions): Promise<Result<T, Failure>> => {
    calls.push(`${m} ${p}`);
    return ok("real" as T);
  };
  return { request, get: (p, o) => request("GET", p, o), post: (p, o) => request("POST", p, o),
           put: (p, o) => request("PUT", p, o), patch: (p, o) => request("PATCH", p, o),
           delete: (p, o) => request("DELETE", p, o) };
};
const plan = (rules: Plan["rules"], seed?: number): Plan => ({ rules, seed });
const fail = (r: unknown) => (r as { error: Failure }).error;

describe("matching", () => {
  it("* matches everything", () => expect(matches("*", "GET", "/anything")).toBe(true));
  it("method must agree", () => expect(matches("GET /items", "POST", "/items")).toBe(false));
  it("* covers a segment run", () => {
    expect(matches("GET /items/*", "GET", "/items/a/b")).toBe(true);
    expect(matches("GET /items/*", "GET", "/other")).toBe(false);
  });
  it("first rule in order wins", async () => {
    const c = withChaos(stub(), plan([["GET /x", { fail: "forbidden" }], ["*", { fail: "internal" }]]));
    expect(fail(await c.get("/x")).kind).toBe("forbidden");
  });
});

describe("effects", () => {
  it("fail returns the kind, unnarrowed", async () => {
    const c = withChaos(stub(), plan([["*", { fail: "rate_limited" }]]));
    expect(fail(await c.get("/x")).kind).toBe("rate_limited");
  });

  it("empty is a SUCCESS, not a failure — the axis nobody asks for", async () => {
    const list = withChaos(stub(), plan([["*", { empty: "list" }]]));
    const one = withChaos(stub(), plan([["*", { empty: "null" }]]));
    const a = await list.get("/x"), b = await one.get("/x");
    expect(a.ok && a.value, "looked and found nothing is not an error").toEqual([]);
    expect(b.ok && b.value).toBeNull();
  });

  it("a forced failure carries the interaction id", async () => {
    const c = withChaos(stub(), plan([["*", { fail: "internal" }]]), "cid-7");
    expect(fail(await c.get("/x")).correlationId).toBe("cid-7");
  });

  it("hang never settles, but still honours an abort", async () => {
    const c = withChaos(stub(), plan([["*", { hang: true }]]));
    const controller = new AbortController();
    let settled = false;
    const pending = c.get("/x", { signal: controller.signal }).then((r) => { settled = true; return r; });
    await new Promise((r) => setTimeout(r, 20));
    expect(settled, "a stuck spinner is the point").toBe(false);
    controller.abort();
    expect(fail(await pending).kind, "a hang that ignores abort is a leak").toBe("canceled");
  }, 3000);

  it("does not call through when an effect applies, and does when it does not", async () => {
    const calls: string[] = [];
    const c = withChaos(stub(calls), plan([["GET /blocked", { fail: "internal" }]]));
    await c.get("/blocked");
    await c.get("/allowed");
    expect(calls).toEqual(["GET /allowed"]);
  });
});

describe("reproducibility", () => {
  it("the same seed gives the same sequence", () => {
    const a = rng(7), b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("a probabilistic plan replays identically", async () => {
    const run = async () => {
      const c = withChaos(stub(), plan([["*", { fail: "internal", p: 0.5 }]], 42));
      return Promise.all([1, 2, 3, 4, 5, 6].map(async () => (await c.get("/x")).ok));
    };
    expect(await run(), "a run you cannot replay is an anecdote").toEqual(await run());
  });
});

describe("parsePlan — total and silent", () => {
  it("returns undefined rather than throwing on nonsense", () => {
    for (const q of ["", "chaos=", "chaos=bogus:thing", "chaos=fail:not_a_kind", "chaos=p:9"]) {
      expect(parsePlan(q), q).toBeUndefined();
    }
  });
  it("a bare effect applies to everything", () => {
    expect(parsePlan("chaos=fail:forbidden")?.rules).toEqual([["*", { fail: "forbidden" }]]);
  });
  it("reads a pattern, several effects and a seed", () => {
    const p = parsePlan("chaos=GET /items=fail:not_found,p:0.3;POST /items=latency:2000&chaosSeed=7");
    expect(p?.rules).toEqual([
      ["GET /items", { fail: "not_found", p: 0.3 }],
      ["POST /items", { latency: 2000 }],
    ]);
    expect(p?.seed).toBe(7);
  });
  it("keeps the good rules when one is malformed", () => {
    expect(parsePlan("chaos=GET /a=nonsense;GET /b=hang")?.rules).toEqual([["GET /b", { hang: true }]]);
  });
});

describe("safety", () => {
  it("an inactive plan returns the very same client object", () => {
    const c = stub();
    expect(withChaos(c, undefined)).toBe(c);
    expect(withChaos(c, plan([]))).toBe(c);
  });
});
