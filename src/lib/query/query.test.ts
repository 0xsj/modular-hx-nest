import { describe, expect, it } from "vitest";
import {
  AppError,
  canceled,
  conflict,
  notFound,
  rateLimited,
  timeout,
  unavailable,
  retryDelay,
  asFailure,
} from "~/lib/kernel";
import { createRoot } from "~/lib/root";
import { keys } from "./keys";
import { defaultItemQuery, itemQuery, itemsQuery } from "./queries";
import { ok, err } from "~/lib/kernel";
import type { MemoryRoute } from "~/lib/http";
import { NO_DEFAULT } from "~/lib/services/example";

/* The policy is the point of this tier, so that is what is tested. The cache
 * itself is TanStack's and is not re-tested here. */

describe("retry policy — the cache asks the kernel", () => {
  const decide = (e: unknown, attempt = 0) => retryDelay(asFailure(e), attempt);

  it("a refusal is an ANSWER and is never retried", () => {
    for (const f of [notFound("x"), conflict("x")]) {
      expect(
        decide(new AppError(f)),
        `${f.kind} is a reply, not a hiccup`,
      ).toBeNull();
    }
  });

  it("a cancellation is never retried — the caller asked for it", () => {
    expect(decide(new AppError(canceled("x")))).toBeNull();
  });

  it("the three retryable kinds get a delay", () => {
    for (const f of [unavailable("x"), timeout("x")]) {
      expect(decide(new AppError(f))).toBeGreaterThan(0);
    }
  });

  it("a 429's own retry-after wins over the backoff curve", () => {
    expect(
      decide(new AppError(rateLimited("slow", 30))),
      "the server said how long; counting attempts would ignore it",
    ).toBe(30_000);
  });

  it("backoff grows and is capped", () => {
    const at = (n: number) => decide(new AppError(unavailable("x")), n)!;
    expect(at(1)).toBeGreaterThan(at(0));
    expect(at(20)).toBeLessThanOrEqual(8_000);
  });

  it("reads a failure back out of a thrown AppError, and out of raw data", () => {
    expect(decide(new AppError(timeout("x")))).toBeGreaterThan(0);
    expect(
      decide(timeout("x")),
      "a failure that crossed as data still classifies",
    ).toBeGreaterThan(0);
    expect(
      decide(new Error("boom")),
      "an unknown throw is internal, not retryable",
    ).toBeNull();
  });
});

describe("keys", () => {
  it("a specific key is prefixed by its collection, so one invalidation reaches both", () => {
    const all = keys.example.all("w");
    expect(keys.example.one("i1").slice(0, 2)).toEqual(all.slice(0, 2));
  });
  it("different workspaces are different caches", () => {
    expect(keys.example.all("a")).not.toEqual(keys.example.all("b"));
  });
});

describe("queries — the one throw site", () => {
  const routes: MemoryRoute[] = [
    {
      method: "GET",
      pattern: /^\/items$/,
      handle: () => ok([{ id: "i1", name: "a", host: "a.example" }]),
    },
    {
      method: "GET",
      pattern: /^\/items\/i1$/,
      handle: () => err(notFound("gone")),
    },
    {
      method: "GET",
      pattern: /^\/workspaces\/w\/default-item$/,
      handle: () => err(notFound("none", { status: 404, type: NO_DEFAULT })),
    },
  ];
  const client = () => createRoot({ routes }).clientFor("example");
  /* `queryFn` is a union with a skip token in the cache's types, so it is not
     directly callable. The cast is a type-level convenience, not a behaviour
     change: this is the same function the cache would invoke. */
  const run = (q: { queryFn?: unknown }) =>
    (q.queryFn as (ctx: { signal: AbortSignal }) => Promise<unknown>)({
      signal: new AbortController().signal,
    });

  it("a value resolves", async () => {
    const q = itemsQuery(client(), "w");
    await expect(run(q)).resolves.toHaveLength(1);
  });

  it("a failure REJECTS, because that is how a cache marks one", async () => {
    const q = itemQuery(client(), "i1");
    await expect(run(q)).rejects.toBeInstanceOf(AppError);
  });

  it("emptiness is a SUCCESS and never touches the error branch", async () => {
    const q = defaultItemQuery(client(), "w");
    await expect(
      run(q),
      "looked and found nothing is not a failure",
    ).resolves.toBeNull();
  });
});
