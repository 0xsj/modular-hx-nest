import { describe, expect, it } from "vitest";
import { createMemoryClient } from "../http";
import { err, notFound, ok, timeout } from "../kernel";
import { createSequenceClient } from "./sequence";

function fixture() {
  let writes = 0;
  const client = createMemoryClient({
    latencyMs: 0,
    routes: [
      {
        method: "PUT",
        pattern: /^\/note$/,
        handle: () => ok({ revision: ++writes }),
      },
      { method: "GET", pattern: /.*/, handle: (request) => ok(request.path) },
    ],
  });
  return { client, writes: () => writes };
}

describe("scripted request sequences", () => {
  it("consumes only the next matching step, exactly once, in invocation order", async () => {
    const script = createSequenceClient(fixture().client, [
      { request: "GET /a", effect: { kind: "reply", value: "first" } },
      { request: "GET /b", effect: { kind: "reply", value: "second" } },
    ]);
    expect((await script.client.get("/b")).unwrapOr(null)).toBe("/b");
    const [one, two] = await Promise.all([
      script.client.get("/a"),
      script.client.get("/a"),
    ]);
    expect(one.unwrapOr(null)).toBe("first");
    expect(two.unwrapOr(null)).toBe("/a");
    expect((await script.client.get("/b")).unwrapOr(null)).toBe("second");
    expect(script.remaining()).toBe(0);
    expect((await script.client.get("/b")).unwrapOr(null)).toBe("/b");
  });

  it("distinguishes rejection before a write from loss after a committed write", async () => {
    const server = fixture();
    const failure = timeout("lost");
    const script = createSequenceClient(server.client, [
      { request: "PUT /note", effect: { kind: "fail", failure } },
      { request: "PUT /note", effect: { kind: "lose-response", failure } },
    ]);
    expect((await script.client.put("/note")).ok).toBe(false);
    expect(server.writes()).toBe(0);
    expect((await script.client.put("/note")).ok).toBe(false);
    expect(server.writes()).toBe(1);
  });

  it("does not replace a genuine refusal with a lost-success effect", async () => {
    const client = createMemoryClient({
      latencyMs: 0,
      routes: [
        { method: "PUT", pattern: /.*/, handle: () => err(notFound("gone")) },
      ],
    });
    const script = createSequenceClient(client, [
      {
        request: "*",
        effect: { kind: "lose-response", failure: timeout("lost") },
      },
    ]);
    const result = await script.client.put("/note");
    expect(!result.ok && result.error.kind).toBe("not_found");
  });

  it("delivers newer data first and the original captured response only after release", async () => {
    const script = createSequenceClient(fixture().client, [
      {
        request: "GET /a",
        effect: { kind: "hold-response", gate: "a", ignoreAbort: true },
      },
    ]);
    const abort = new AbortController();
    let finished = false;
    const old = script.client
      .get("/a", { signal: abort.signal })
      .then((result) => {
        finished = true;
        return result;
      });
    abort.abort();
    expect((await script.client.get("/b")).unwrapOr(null)).toBe("/b");
    expect(finished).toBe(false);
    script.release("a");
    script.release("a");
    expect((await old).unwrapOr(null)).toBe("/a");
  });

  it("allows early release and honors ordinary caller cancellation", async () => {
    const script = createSequenceClient(fixture().client, [
      { request: "GET /a", effect: { kind: "hold-response", gate: "a" } },
      { request: "GET /b", effect: { kind: "hold-response", gate: "b" } },
    ]);
    script.release("a");
    expect((await script.client.get("/a")).unwrapOr(null)).toBe("/a");
    const abort = new AbortController();
    const held = script.client.get("/b", { signal: abort.signal });
    await script.client.get("/c");
    abort.abort();
    const result = await held;
    expect(!result.ok && result.error.kind).toBe("canceled");
  });

  it("disposal releases even uncooperative work and prevents new writes", async () => {
    const server = fixture();
    const script = createSequenceClient(server.client, [
      {
        request: "*",
        effect: { kind: "hold-response", gate: "a", ignoreAbort: true },
      },
    ]);
    const held = script.client.get("/a");
    await script.client.get("/b");
    script.dispose();
    const result = await held;
    expect(!result.ok && result.error.kind).toBe("canceled");
    expect((await script.client.put("/note")).ok).toBe(false);
    expect(server.writes()).toBe(0);
  });

  it("a pre-aborted request does not consume a step", async () => {
    const script = createSequenceClient(fixture().client, [
      { request: "*", effect: { kind: "reply", value: "scripted" } },
    ]);
    expect(
      (await script.client.get("/a", { signal: AbortSignal.abort() })).ok,
    ).toBe(false);
    expect(script.remaining()).toBe(1);
    expect((await script.client.get("/a")).unwrapOr(null)).toBe("scripted");
  });
});
