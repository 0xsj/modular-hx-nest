import { describe, expect, it, vi } from "vitest";
import { narrow, ok, type Failure, type Result } from "../kernel";
import { createMemoryClient, type MemoryRoute } from "../http";
import { parsePlan, withChaos, type Plan } from ".";

const rows = [{ id: "t1" }, { id: "t2" }];
const routes: MemoryRoute[] = [
  { method: "GET", pattern: /^\/targets$/, handle: () => ok(rows) },
  { method: "GET", pattern: /^\/targets\/t1$/, handle: () => ok(rows[0]) },
  { method: "POST", pattern: /^\/targets$/, handle: () => ok(rows[0]) },
];
const base = () => createMemoryClient({ routes, latencyMs: 0 });
const plan = (rules: Plan["rules"], seed?: number): Plan => ({ rules, seed });

describe("it decorates the port and nothing else notices", () => {
  it("passes an unmatched request straight through", async () => {
    const c = withChaos(
      base(),
      plan([["GET /nothing", { fail: "forbidden" }]]),
    );
    const r = await c.get("/targets");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(rows);
  });

  it("forces a failure on a matching one", async () => {
    const c = withChaos(
      base(),
      plan([["GET /targets", { fail: "forbidden" }]]),
    );
    const r = await c.get("/targets");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("forbidden");
  });

  it("matches a wildcard path and respects method", async () => {
    const c = withChaos(
      base(),
      plan([["GET /targets/*", { fail: "not_found" }]]),
    );
    expect((await c.get("/targets/t1")).ok).toBe(false);
    expect((await c.get("/targets")).ok).toBe(true); // no segment to match
    expect((await c.post("/targets")).ok).toBe(true); // wrong method
  });

  it("`*` matches everything", async () => {
    const c = withChaos(base(), plan([["*", { fail: "unavailable" }]]));
    expect((await c.get("/targets")).ok).toBe(false);
    expect((await c.post("/targets")).ok).toBe(false);
  });

  it("takes the first matching rule, so specific rules go first", async () => {
    const c = withChaos(
      base(),
      plan([
        ["GET /targets", { fail: "conflict" }],
        ["*", { fail: "unavailable" }],
      ]),
    );
    const r = await c.get("/targets");
    if (!r.ok) expect(r.error.kind).toBe("conflict");
  });
});

describe("emptiness — the axis fixtures hide", () => {
  it("forces a null, which is a SUCCESS and not a failure", async () => {
    const c = withChaos(base(), plan([["GET /targets/*", { empty: "null" }]]));
    const r = await c.get("/targets/t1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it("forces an empty collection", async () => {
    const c = withChaos(base(), plan([["GET /targets", { empty: "list" }]]));
    const r = await c.get("/targets");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual([]);
  });
});

describe("latency and hang", () => {
  it("delays before answering", async () => {
    const c = withChaos(base(), plan([["GET /targets", { latency: 40 }]]));
    const started = Date.now();
    await c.get("/targets");
    expect(Date.now() - started).toBeGreaterThanOrEqual(35);
  });

  it("hang never settles — the stuck spinner, not a timeout", async () => {
    const c = withChaos(base(), plan([["GET /targets", { hang: true }]]));
    const settled = vi.fn();
    void c.get("/targets").then(settled);
    await new Promise((r) => setTimeout(r, 60));
    expect(settled).not.toHaveBeenCalled();
  });

  it("but still honours cancellation, because a hang that ignores abort is a leak", async () => {
    const c = withChaos(base(), plan([["GET /targets", { hang: true }]]));
    const controller = new AbortController();
    const pending = c.get("/targets", { signal: controller.signal });
    controller.abort();
    const r = await pending;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("canceled");
  });
});

describe("a probabilistic plan replays", () => {
  const run = async (seed: number) => {
    const c = withChaos(
      base(),
      plan([["GET /targets", { fail: "internal", p: 0.5 }]], seed),
    );
    const out: boolean[] = [];
    for (let i = 0; i < 12; i++) out.push((await c.get("/targets")).ok);
    return out;
  };

  it("the same seed gives the same sequence", async () => {
    expect(await run(7)).toEqual(await run(7));
  });

  it("a different seed gives a different one", async () => {
    expect(await run(7)).not.toEqual(await run(99));
  });

  it("and it is neither always nor never", async () => {
    const r = await run(7);
    expect(new Set(r).size).toBe(2);
  });
});

describe("a forced failure travels the REAL path", () => {
  it("arrives unnarrowed, so a read's own narrowing folds it", async () => {
    const c = withChaos(
      base(),
      plan([["GET /targets/*", { fail: "invalid" }]]),
    );
    const asRead = narrow("not_found");
    const raw: Result<unknown, Failure> = await c.get("/targets/t1");
    expect(raw.ok).toBe(false);
    if (raw.ok) return;
    const folded = asRead(raw.error);
    expect(folded.kind).toBe("internal"); // a read cannot produce `invalid`
    expect(folded.cause?.kind).toBe("invalid"); // and nothing was lost
  });
});

describe("a plan is a link", () => {
  it("the short form breaks everything", () => {
    const p = parsePlan("chaos=fail:forbidden");
    expect(p?.rules).toEqual([["*", { fail: "forbidden" }]]);
  });

  it("parses a route, several effects and a seed", () => {
    const p = parsePlan(
      "chaos=GET /targets=fail:not_found,p:0.3;POST /targets=latency:2000&chaosSeed=7",
    );
    expect(p?.rules).toEqual([
      ["GET /targets", { fail: "not_found", p: 0.3 }],
      ["POST /targets", { latency: 2000 }],
    ]);
    expect(p?.seed).toBe(7);
  });

  it("round-trips into a working client", async () => {
    const c = withChaos(base(), parsePlan("chaos=GET /targets=empty:list"));
    const r = await c.get("/targets");
    expect(r.ok && r.value).toEqual([]);
  });

  it("is TOTAL — a malformed plan is undefined, never a throw", () => {
    for (const s of [
      "chaos=",
      "chaos=nonsense",
      "chaos=fail:not_a_kind",
      "chaos=latency:abc",
      "chaos=p:5",
      "chaos===",
      "other=1",
    ]) {
      expect(() => parsePlan(s)).not.toThrow();
      expect(parsePlan(s)).toBeUndefined();
    }
  });

  it("keeps the rules it can parse and drops the ones it cannot", () => {
    const p = parsePlan("chaos=GET /a=fail:bogus;GET /b=fail:conflict");
    expect(p?.rules).toEqual([["GET /b", { fail: "conflict" }]]);
  });
});

describe("safety", () => {
  it("is a no-op with no plan", async () => {
    const c = base();
    expect(withChaos(c, undefined)).toBe(c);
    expect(withChaos(c, { rules: [] })).toBe(c);
  });

  it("is a no-op in production — structurally, not by default", async () => {
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    const c = base();
    expect(withChaos(c, plan([["*", { fail: "internal" }]]))).toBe(c);
    vi.stubEnv("NODE_ENV", before ?? "test");
  });
});
