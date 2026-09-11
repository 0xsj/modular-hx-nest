import {
  absentWhenType,
  all,
  err,
  invalid,
  narrow,
  optional,
  type Fails,
  type Result,
  type TransportFailure,
} from "../../kernel";
import type { CallOptions, HttpClient } from "../../http";
import { NO_DEFAULT, type Item, type NewItem } from "./example.types";
import {
  decodeItem,
  decodeItems,
  decodeOptionalItem,
} from "./example.responses";

/* Takes the client, never imports one. That is the rule the whole tier exists
 * to hold — see ../doc.ts. */

/** Named once and reused. Any call can produce a transport failure; a read
 *  additionally promises `not_found` and nothing else. */
export type ReadFailure = TransportFailure | Fails<"not_found">;
export type WriteFailure = TransportFailure | Fails<"invalid" | "conflict">;

const asRead = narrow("not_found");
const asWrite = narrow("invalid", "conflict");

/** A list. An empty one is a VALUE — never a failure, and never a `not_found`. */
export async function listItems(
  client: HttpClient,
  workspace: string,
  options?: CallOptions,
): Promise<Result<Item[], ReadFailure>> {
  return (
    await client.get<unknown>("/items", {
      params: { workspace },
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeItems(value, options?.trace))
    .mapErr(asRead);
}

/** A read by id. Here `not_found` means the caller asked for something that
 *  should have existed — a bad id. */
export async function getItem(
  client: HttpClient,
  id: string,
  options?: CallOptions,
): Promise<Result<Item, ReadFailure>> {
  return (
    await client.get<unknown>(`/items/${encodeURIComponent(id)}`, {
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeItem(value, options?.trace))
    .mapErr(asRead);
}

/** A read whose emptiness is a legitimate answer, so it says so in its type.
 *
 *  `optional` removes `not_found` from what this can fail with — a caller
 *  cannot write a branch for a case that can no longer occur — and a 404 the
 *  service does not recognise as absence becomes `internal` rather than being
 *  reported as nothing-here. */
export async function findDefaultItem(
  client: HttpClient,
  workspace: string,
  options?: CallOptions,
): Promise<Result<Item | null, TransportFailure>> {
  return optional(
    (
      await client.get<unknown>(`/workspaces/${workspace}/default-item`, {
        signal: options?.signal,
        trace: options?.trace,
      })
    )
      .andThen((value) => decodeOptionalItem(value, options?.trace))
      .mapErr(asRead),
    absentWhenType(NO_DEFAULT),
  );
}

/** A write. Client-side validation produces the SAME shape the server would, so
 *  a form renders one branch rather than two — and moving a rule to the server
 *  later changes nothing above this line. */
export async function createItem(
  client: HttpClient,
  input: NewItem,
  options?: CallOptions,
): Promise<Result<Item, WriteFailure>> {
  const fields: Record<string, string> = {};
  if (!input.name.trim()) fields.name = "A name is required.";
  if (!/^[a-z0-9.-]+$/i.test(input.host))
    fields.host = "That is not a hostname.";
  if (Object.keys(fields).length)
    return err(invalid("Check the form.", fields));

  return (
    await client.post<unknown>("/items", {
      body: input,
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeItem(value, options?.trace))
    .mapErr(asWrite);
}

/* ── composition: the two shapes that actually occur ──────────────────────── */

/** INDEPENDENT — issue both, then collect. `all` returns the FIRST failure,
 *  which is what a screen rendering one problem surface wants. */
export async function itemPage(
  client: HttpClient,
  workspace: string,
  id: string,
  options?: CallOptions,
): Promise<Result<{ item: Item; siblings: Item[] }, ReadFailure>> {
  const [item, siblings] = await Promise.all([
    getItem(client, id, options),
    listItems(client, workspace, options),
  ]);
  return all([item, siblings]).map(([i, s]) => ({ item: i, siblings: s }));
}

/** DEPENDENT — step two needs step one's value. TypeScript has no `?`, so this
 *  is an early return, permanently. It reads better than any combinator would. */
export async function renameItem(
  client: HttpClient,
  id: string,
  name: string,
  options?: CallOptions,
): Promise<Result<Item, ReadFailure>> {
  const current = await getItem(client, id, options);
  if (!current.ok) return current;

  return (
    await client.patch<unknown>(`/items/${encodeURIComponent(id)}`, {
      body: { name, host: current.value.host },
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeItem(value, options?.trace))
    .mapErr(asRead);
}
