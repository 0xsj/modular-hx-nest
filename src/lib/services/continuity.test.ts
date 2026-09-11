import { describe, expect, it } from "vitest";
import { createMemoryClient } from "../http";
import { ok } from "../kernel";
import { readCapabilities } from "./access";
import { cancelJob, readJob } from "./jobs";

describe("capability and job wire boundaries", () => {
  it("encodes resource identities and rejects a policy from another account", async () => {
    const client = createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "GET",
          pattern: /^\/capabilities\/a%2Fb$/,
          handle: () =>
            ok({ subject: "owner", resource: "a/b", revision: 1, grants: {} }),
        },
      ],
    });
    expect((await readCapabilities(client, "owner", "a/b")).ok).toBe(true);
    expect(await readCapabilities(client, "other", "a/b")).toMatchObject({
      ok: false,
      error: { type: "invalid_response" },
    });
  });
  it("encodes job identities and rejects mismatched snapshots and cancellation acknowledgments", async () => {
    let id = "a/b";
    const client = createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "GET",
          pattern: /^\/jobs\/a%2Fb$/,
          handle: () =>
            ok({
              id,
              kind: "import",
              revision: 1,
              state: "queued",
              secret: "discard",
            }),
        },
        {
          method: "POST",
          pattern: /^\/jobs\/a%2Fb\/cancel$/,
          handle: () => ok({ id, accepted: true }),
        },
      ],
    });
    expect((await readJob(client, id)).unwrapOr(null)).toEqual({
      id,
      kind: "import",
      revision: 1,
      state: "queued",
    });
    expect((await cancelJob(client, id)).ok).toBe(true);
    id = "another";
    expect(await readJob(client, "a/b")).toMatchObject({
      ok: false,
      error: { type: "invalid_response" },
    });
    expect(await cancelJob(client, "a/b")).toMatchObject({
      ok: false,
      error: { type: "invalid_response" },
    });
  });
});
