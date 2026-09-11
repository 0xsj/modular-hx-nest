// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { err, invalid, ok } from "../kernel";
import {
  createBrowserStorage,
  createDocument,
  createMemoryStorage,
  type DocumentSchema,
} from ".";

const schema: DocumentSchema<{ count: number }> = {
  key: "counter",
  version: 2,
  decode(value) {
    return typeof value === "object" &&
      value !== null &&
      "count" in value &&
      typeof value.count === "number" &&
      Number.isFinite(value.count)
      ? ok({ count: value.count })
      : err(invalid("Expected a count", {}));
  },
};
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("registered storage documents", () => {
  it("distinguishes missing, zero, and corrupt data without repairing reads", () => {
    const port = createMemoryStorage();
    const doc = createDocument(port, "test", schema);
    expect(doc.read()).toMatchObject({ ok: true, value: { state: "missing" } });
    expect(doc.write({ count: 0 }).ok).toBe(true);
    expect(doc.read()).toMatchObject({
      ok: true,
      value: { state: "found", value: { count: 0 }, migrated: false },
    });
    port.write("test:counter", "broken");
    expect(doc.read()).toMatchObject({
      ok: false,
      error: { type: "storage_invalid" },
    });
    expect(port.read("test:counter")).toMatchObject({ value: "broken" });
  });
  it.each([
    "null",
    "[]",
    "{}",
    '{"version":0,"value":{}}',
    '{"version":2.5,"value":{}}',
    '{"version":2}',
    '{"version":2,"value":{"count":"3"}}',
  ])("rejects malformed envelope or shape: %s", (raw) => {
    const port = createMemoryStorage();
    port.write("test:counter", raw);
    expect(createDocument(port, "test", schema).read().ok).toBe(false);
  });
  it("migrates in memory, revalidates, and commits only on explicit save", () => {
    const port = createMemoryStorage();
    const raw = JSON.stringify({ version: 1, value: 7 });
    port.write("test:counter", raw);
    const doc = createDocument(port, "test", {
      ...schema,
      migrate: (value, version) =>
        version === 1 && typeof value === "number"
          ? ok({ count: value })
          : err(invalid("Unsupported", {})),
    });
    expect(doc.read()).toMatchObject({
      value: { state: "found", value: { count: 7 }, migrated: true },
    });
    expect(port.read("test:counter")).toMatchObject({ value: raw });
    expect(doc.write({ count: 7 }).ok).toBe(true);
    expect(doc.read()).toMatchObject({ value: { migrated: false } });
  });
  it("refuses an unsupported older version and protects a newer version on write", () => {
    const port = createMemoryStorage();
    const doc = createDocument(port, "test", schema);
    for (const version of [1, 3]) {
      const raw = JSON.stringify({ version, value: { count: 8 } });
      port.write("test:counter", raw);
      expect(doc.read()).toMatchObject({
        ok: false,
        error: { type: "storage_version" },
      });
    }
    expect(doc.write({ count: 4 })).toMatchObject({
      ok: false,
      error: { type: "storage_version" },
    });
    expect(doc.remove().ok).toBe(true);
    expect(doc.write({ count: 4 }).ok).toBe(true);
  });
  it("keeps namespace/key boundaries unambiguous and removes only its own key", () => {
    const port = createMemoryStorage();
    const a = createDocument(port, "account:a", { ...schema, key: "b" });
    const b = createDocument(port, "account", { ...schema, key: "a:b" });
    a.write({ count: 1 });
    b.write({ count: 2 });
    a.remove();
    expect(b.read()).toMatchObject({ value: { value: { count: 2 } } });
  });
  it("rejects invalid writes, serialization loss and throwing decoders without losing saved data", () => {
    const port = createMemoryStorage();
    const doc = createDocument(port, "test", schema);
    doc.write({ count: 5 });
    expect(doc.write({ count: Infinity }).ok).toBe(false);
    const needsUndefined = createDocument(port, "test", {
      key: "undefined",
      version: 1,
      decode: (v: unknown) =>
        v === undefined ? ok(v) : err(invalid("Expected undefined", {})),
    });
    expect(needsUndefined.write(undefined).ok).toBe(false);
    const throws = createDocument(port, "test", {
      ...schema,
      decode: () => {
        throw new Error("decoder");
      },
    });
    expect(throws.read()).toMatchObject({
      ok: false,
      error: { type: "storage_invalid" },
    });
    expect(doc.read()).toMatchObject({ value: { value: { count: 5 } } });
  });
  it("subscribes only to its own successful changes and supports cleanup", () => {
    const port = createMemoryStorage();
    const doc = createDocument(port, "test", schema);
    const listener = vi.fn();
    const sub = doc.subscribe(listener);
    port.write("other", "x");
    doc.write({ count: NaN });
    expect(listener).not.toHaveBeenCalled();
    doc.write({ count: 4 });
    doc.remove();
    expect(listener).toHaveBeenCalledTimes(2);
    if (sub.ok) sub.value();
    doc.write({ count: 9 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("browser adapter", () => {
  it("supports tab-local storage without touching local storage or its subscribers", () => {
    const local = createBrowserStorage(),
      session = createBrowserStorage("session");
    const listener = vi.fn();
    const subscription = local.subscribe("draft", listener);
    local.write("draft", "local");
    listener.mockClear();
    expect(session.write("draft", "tab").ok).toBe(true);
    expect(session.read("draft").unwrapOr(null)).toBe("tab");
    expect(local.read("draft").unwrapOr(null)).toBe("local");
    expect(listener).not.toHaveBeenCalled();
    if (subscription.ok) subscription.value();
  });
  it("is lazy and turns a denied accessor into a Failure", () => {
    const get = vi
      .spyOn(window, "localStorage", "get")
      .mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
    const port = createBrowserStorage();
    expect(get).not.toHaveBeenCalled();
    expect(port.read("x")).toMatchObject({
      ok: false,
      error: { kind: "forbidden", type: "storage_blocked" },
    });
    expect(port.subscribe("x", vi.fn()).ok).toBe(false);
  });
  it("reports quota failure without claiming a save or notifying listeners", () => {
    const port = createBrowserStorage();
    port.write("x", "old");
    const listener = vi.fn();
    const sub = port.subscribe("x", listener);
    const storage = window.localStorage;
    const denied = vi.spyOn(window, "localStorage", "get").mockReturnValue(
      new Proxy(storage, {
        get(target, key) {
          if (key === "setItem")
            return () => {
              throw new DOMException("full", "QuotaExceededError");
            };
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }),
    );
    expect(port.write("x", "new")).toMatchObject({
      ok: false,
      error: { kind: "conflict", type: "storage_quota" },
    });
    denied.mockRestore();
    expect(port.read("x")).toMatchObject({ value: "old" });
    expect(listener).not.toHaveBeenCalled();
    if (sub.ok) sub.value();
  });
  it("notifies across adapter instances in this tab and filters cross-tab events", () => {
    const a = createBrowserStorage(),
      b = createBrowserStorage();
    const listener = vi.fn();
    const sub = a.subscribe("x", listener);
    b.write("x", "1");
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "other", storageArea: localStorage }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: "x", storageArea: sessionStorage }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "x", storageArea: localStorage }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: null, storageArea: localStorage }),
    );
    expect(listener).toHaveBeenCalledTimes(3);
    if (sub.ok) sub.value();
    b.remove("x");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "x", storageArea: localStorage }),
    );
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
