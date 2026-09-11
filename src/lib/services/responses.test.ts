import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFetchClient,
  createMemoryClient,
  type HttpClient,
} from "../http";
import { isRetryable, ok, type Result } from "../kernel";
import { currentUser, listSessions, signIn, signUp } from "./session";
import {
  createItem,
  findDefaultItem,
  getItem,
  listItems,
  renameItem,
} from "./example";
import { getMyActivity } from "./ledger";
import { findNoteSave, saveNote } from "./example/note.api";

const item = { id: "i1", name: "API", host: "api.example.com" };
const user = { id: "u1", name: "Ada", email: "ada@example.com" };
const attempt = {
  operationId: "op-1",
  draft: { title: "A note", body: "Keep this" },
};
const operations: Array<
  [string, (client: HttpClient) => Promise<Result<unknown>>]
> = [
  ["current user", (c) => currentUser(c)],
  [
    "sign in",
    (c) => signIn(c, { email: "ada@example.com", password: "password" }),
  ],
  [
    "sign up",
    (c) =>
      signUp(c, {
        name: "Ada",
        email: "ada@example.com",
        password: "password",
      }),
  ],
  ["session list", (c) => listSessions(c)],
  ["item list", (c) => listItems(c, "workspace")],
  ["item", (c) => getItem(c, "i1")],
  ["optional item", (c) => findDefaultItem(c, "workspace")],
  ["created item", (c) => createItem(c, item)],
  ["renamed item", (c) => renameItem(c, "i1", "renamed")],
  ["activity", (c) => getMyActivity(c)],
  ["save receipt", (c) => saveNote(c, attempt)],
  ["receipt lookup", (c) => findNoteSave(c, attempt.operationId)],
];

function memory(value: unknown) {
  return createMemoryClient({
    latencyMs: 0,
    routes: ["GET", "POST", "PUT", "PATCH"].map((method) => ({
      method,
      pattern: /.*/,
      handle: () => ok(value),
    })),
  });
}
afterEach(() => vi.unstubAllGlobals());

describe.each(["memory", "fetch"])(
  "%s success responses cross the same boundary",
  (adapter) => {
    it.each(operations)(
      "%s rejects a malformed success as a non-retryable contract failure",
      async (_name, operation) => {
        const payload = { unexpected: "PRIVATE_PAYLOAD" };
        vi.stubGlobal(
          "fetch",
          vi.fn(async () => Response.json(payload)),
        );
        const client =
          adapter === "memory"
            ? memory(payload)
            : createFetchClient({ baseUrl: "https://example.test" });
        const result = await operation(client);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toMatchObject({
            kind: "internal",
            type: "invalid_response",
          });
          expect(isRetryable(result.error)).toBe(false);
          expect(JSON.stringify(result.error)).not.toContain("PRIVATE_PAYLOAD");
        }
      },
    );
  },
);

it("projects user and session data instead of leaking extra credential fields", async () => {
  const result = await currentUser(
    memory({ ...user, password: "secret", token: "secret" }),
  );
  expect(result.unwrapOr(null)).toEqual(user);
  const session = await signIn(
    memory({
      token: "token",
      user: { ...user, password: "secret" },
      refreshToken: "secret",
    }),
    { email: user.email, password: "password" },
  );
  expect(session.unwrapOr(null)).toEqual({ token: "token", user });
  const summary = {
    id: "s1",
    current: false,
    createdAt: "2026-09-10T10:00:00Z",
  };
  expect(
    (await listSessions(memory([{ ...summary, token: "secret" }]))).unwrapOr(
      null,
    ),
  ).toEqual([summary]);
});

it("rejects nested malformed fields and an invalid member instead of silently filtering it", async () => {
  expect(
    (
      await signIn(memory({ token: "token", user: { ...user, name: null } }), {
        email: user.email,
        password: "password",
      })
    ).ok,
  ).toBe(false);
  expect((await listItems(memory([item, { ...item, host: 42 }]), "w")).ok).toBe(
    false,
  );
  expect(
    (
      await listSessions(
        memory([{ id: "s", current: "false", createdAt: "bad" }]),
      )
    ).ok,
  ).toBe(false);
});

it("keeps valid empty values distinct from malformed values", async () => {
  expect((await listItems(memory([]), "w")).unwrapOr(null)).toEqual([]);
  expect(
    (await findDefaultItem(memory(null), "w")).unwrapOr("wrong"),
  ).toBeNull();
  expect((await getItem(memory(null), "i")).ok).toBe(false);
  expect((await listItems(memory(null), "w")).ok).toBe(false);
});

it("validates activity metadata and keeps absent pagination fields absent", async () => {
  expect((await getMyActivity(memory({ entries: [] }))).unwrapOr(null)).toEqual(
    { entries: [] },
  );
  for (const payload of [
    { entries: [], facets: [{ facet: "session", total: -1 }] },
    { entries: [], facets: [{ facet: "session", total: "1" }] },
    { entries: [], next: null },
    { entries: [], facets: null },
    { entries: [{ id: "bad" }] },
  ])
    expect((await getMyActivity(memory(payload))).ok).toBe(false);
});

it("rejects a receipt for the wrong operation or draft", async () => {
  expect(
    (
      await saveNote(
        memory({ ...attempt, operationId: "other", revision: 1 }),
        attempt,
      )
    ).ok,
  ).toBe(false);
  expect(
    (
      await saveNote(
        memory({
          ...attempt,
          draft: { title: "other", body: "Keep this" },
          revision: 1,
        }),
        attempt,
      )
    ).ok,
  ).toBe(false);
  expect(
    (
      await findNoteSave(
        memory({ ...attempt, operationId: "other", revision: 1 }),
        attempt.operationId,
      )
    ).ok,
  ).toBe(false);
});

it("validates the final response of a dependent operation too", async () => {
  const client = createMemoryClient({
    latencyMs: 0,
    routes: [
      { method: "GET", pattern: /.*/, handle: () => ok(item) },
      {
        method: "PATCH",
        pattern: /.*/,
        handle: () => ok({ ...item, name: 42 }),
      },
    ],
  });
  expect((await renameItem(client, item.id, "renamed")).ok).toBe(false);
});
