import { describe, expect, it } from "vitest";
import {
  err,
  isRetryable,
  notFound,
  ok,
  presenceOf,
  rateLimited,
} from "../../kernel";
import { createMemoryClient, type MemoryRoute } from "../../http";
import {
  createItem,
  findDefaultItem,
  getItem,
  itemPage,
  listItems,
  renameItem,
  NO_DEFAULT,
  type Item,
} from ".";

const items: Item[] = [
  { id: "i1", name: "api", host: "api.example.com" },
  { id: "i2", name: "www", host: "www.example.com" },
];

const routes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/items$/,
    handle: (req) => (req.params?.workspace === "empty" ? ok([]) : ok(items)),
  },
  { method: "GET", pattern: /^\/items\/i1$/, handle: () => ok(items[0]) },
  /* A route that deliberately 404s. An id matching NO route is `internal` /
     `unserved_route` — this fixture was never asked — which must not be
     mistakable for the server saying it does not exist. A fixture that wants a
     404 registers one, which is the discipline. */
  {
    method: "GET",
    pattern: /^\/items\/gone$/,
    handle: () => err(notFound("No such item.", { status: 404 })),
  },
  {
    method: "GET",
    pattern: /^\/items\/busy$/,
    handle: () => err(rateLimited("Slow down.", 12)),
  },
  {
    method: "GET",
    pattern: /^\/items\/moved$/,
    handle: () => err({ kind: "conflict", message: "It moved.", status: 409 }),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/set\/default-item$/,
    handle: () => ok(items[0]),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/none\/default-item$/,
    handle: () =>
      err(notFound("No default.", { status: 404, type: NO_DEFAULT })),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/typo\/default-item$/,
    handle: () => err(notFound("No such path.", { status: 404 })),
  },
  {
    method: "POST",
    pattern: /^\/items$/,
    handle: (req) =>
      (req.body as Item).name === "api"
        ? err({ kind: "conflict", message: "Name taken.", status: 409 })
        : ok({ ...(req.body as Item), id: "i3" }),
  },
  {
    method: "PATCH",
    pattern: /^\/items\/i1$/,
    handle: (req) => ok({ ...items[0], ...(req.body as Item) }),
  },
];

const client = createMemoryClient({ routes, latencyMs: 0 });

describe("a service names the endpoint and takes the client", () => {
  it("reads a list", async () => {
    const r = await listItems(client, "w1");
    expect(r.ok && r.value).toEqual(items);
  });

  it("an empty list is a VALUE, not a failure and not a not_found", async () => {
    const r = await listItems(client, "empty");
    expect(r.ok && r.value).toEqual([]);
  });

  it("a bad id is not_found — a domain kind this read promises", async () => {
    const r = await getItem(client, "gone");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("not_found");
  });
});

describe("narrowing keeps the transport half intact", () => {
  it("a rate limit passes through with its retry-after", async () => {
    const r = await getItem(client, "busy");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("rate_limited");
    if (r.error.kind === "rate_limited") expect(r.error.retryAfter).toBe(12);
  });

  it("a domain kind this read did NOT promise folds, keeping the original", async () => {
    const r = await getItem(client, "moved");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("internal");
    expect(r.error.cause?.kind).toBe("conflict");
  });
});

describe("absence is a value where the service says it is", () => {
  it("found", async () => {
    expect(presenceOf(await findDefaultItem(client, "set")).state).toBe(
      "found",
    );
  });

  it("looked and found nothing — a SUCCESS carrying null", async () => {
    const r = await findDefaultItem(client, "none");
    expect(r.ok && r.value).toBeNull();
    expect(presenceOf(r).state).toBe("empty");
  });

  it("a 404 the service does not recognise is NOT emptiness", async () => {
    const r = await findDefaultItem(client, "typo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("internal");
    expect(presenceOf(r).state).toBe("unmeasured");
  });

  it("all three states are distinct, which is the whole point", async () => {
    const states = await Promise.all(
      ["set", "none", "typo"].map(
        async (w) => presenceOf(await findDefaultItem(client, w)).state,
      ),
    );
    expect(new Set(states).size).toBe(3);
  });
});

describe("a write", () => {
  it("validates locally in the SAME shape the server would", async () => {
    const r = await createItem(client, { name: "", host: "!!" });
    if (r.ok || r.error.kind !== "invalid") throw new Error("expected invalid");
    expect(r.error.fields).toEqual({
      name: "A name is required.",
      host: "That is not a hostname.",
    });
  });

  it("and surfaces the server's own refusal", async () => {
    const r = await createItem(client, {
      name: "api",
      host: "other.example.com",
    });
    if (r.ok) throw new Error("expected conflict");
    expect(r.error.kind).toBe("conflict");
  });

  it("succeeds otherwise", async () => {
    const r = await createItem(client, {
      name: "new",
      host: "new.example.com",
    });
    expect(r.ok && r.value.id).toBe("i3");
  });
});

describe("composition", () => {
  it("independent calls collect, and the tuple is preserved", async () => {
    const r = await itemPage(client, "w1", "i1");
    expect(r.ok && r.value.item.id).toBe("i1");
    expect(r.ok && r.value.siblings).toHaveLength(2);
  });

  it("and return the FIRST failure", async () => {
    const r = await itemPage(client, "w1", "gone");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("not_found");
  });

  it("a dependent call uses the first result's value", async () => {
    const r = await renameItem(client, "i1", "renamed");
    expect(r.ok && r.value).toEqual({
      id: "i1",
      name: "renamed",
      host: "api.example.com",
    });
  });

  it("and short-circuits when the first step fails", async () => {
    const r = await renameItem(client, "gone", "x");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("not_found");
  });
});

describe("an unserved fixture route is not a 404, and the tier keeps that true", () => {
  it("an id nobody registered is `internal`, so it cannot be read as absence", async () => {
    const r = await getItem(client, "never-registered");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("internal");
    expect(r.error.type).toBe("unserved_route");
  });

  it("while a route that MEANS not_found says so", async () => {
    const r = await getItem(client, "gone");
    if (r.ok) throw new Error("expected a failure");
    expect(r.error.kind).toBe("not_found");
  });
});

describe("a caller can cancel — the kind every tier defends and none could produce", () => {
  it("an already-aborted signal reaches the port through the service", async () => {
    const controller = new AbortController();
    controller.abort();
    const r = await listItems(client, "w1", { signal: controller.signal });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("canceled");
  });

  it("aborting mid-flight cancels a slow request", async () => {
    const slow = createMemoryClient({ routes, latencyMs: 200 });
    const controller = new AbortController();
    const pending = listItems(slow, "w1", { signal: controller.signal });
    controller.abort();
    const r = await pending;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("canceled");
  });

  it("a composition threads the signal into every call it makes", async () => {
    const controller = new AbortController();
    controller.abort();
    const r = await itemPage(client, "w1", "i1", { signal: controller.signal });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("canceled");
  });

  it("and a cancellation is never retryable, because it was asked for", async () => {
    const controller = new AbortController();
    controller.abort();
    const r = await getItem(client, "i1", { signal: controller.signal });
    if (r.ok) throw new Error("expected canceled");
    expect(isRetryable(r.error)).toBe(false);
  });
});
