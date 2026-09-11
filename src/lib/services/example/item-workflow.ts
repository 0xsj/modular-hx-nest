import {
  absentWhenType,
  err,
  internal,
  invalid,
  narrow,
  ok,
  optional,
  type Fails,
  type Result,
  type TransportFailure,
} from "../../kernel";
import {
  responseDecoder,
  responseObject,
  responseText,
  type CallOptions,
  type HttpClient,
} from "../../http";
import type { Item, NewItem } from "./example.types";

export type EditableItem = Item & { revision: number };
export type ItemAttempt = {
  id: string;
  expectedRevision: number;
  operationId: string;
  draft: NewItem;
};
export type ItemReceipt = ItemAttempt & { item: EditableItem };
export type ItemSaveFailure =
  TransportFailure | Fails<"invalid" | "conflict" | "not_found">;
export const NO_ITEM_SAVE = "no_item_save";
export const sameItemDraft = (a: NewItem, b: NewItem) =>
  a.name === b.name && a.host === b.host;
const positive = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n > 0;

/** Draft decoding allows invalid form input; submission validation is separate. */
export function readItemDraft(raw: unknown): NewItem | undefined {
  const value = responseObject(raw);
  return value &&
    typeof value.name === "string" &&
    value.name.length <= 120 &&
    typeof value.host === "string" &&
    value.host.length <= 253
    ? { name: value.name, host: value.host }
    : undefined;
}
export function readEditableItem(raw: unknown): EditableItem | undefined {
  const value = responseObject(raw),
    draft = readItemDraft(raw);
  return value &&
    draft &&
    responseText(value.id) &&
    value.id.length <= 100 &&
    positive(value.revision) &&
    draft.name.trim() &&
    draft.host
    ? { id: value.id, ...draft, revision: value.revision }
    : undefined;
}
export function readItemAttempt(raw: unknown): ItemAttempt | undefined {
  const value = responseObject(raw),
    draft = readItemDraft(value?.draft);
  return value &&
    draft &&
    responseText(value.id) &&
    value.id.length <= 100 &&
    responseText(value.operationId) &&
    value.operationId.length <= 100 &&
    positive(value.expectedRevision)
    ? {
        id: value.id,
        expectedRevision: value.expectedRevision,
        operationId: value.operationId,
        draft,
      }
    : undefined;
}
export function readItemReceipt(raw: unknown): ItemReceipt | undefined {
  const value = responseObject(raw),
    attempt = readItemAttempt(raw),
    item = readEditableItem(value?.item);
  return attempt &&
    item &&
    item.id === attempt.id &&
    item.revision === attempt.expectedRevision + 1 &&
    sameItemDraft(item, attempt.draft)
    ? { ...attempt, item }
    : undefined;
}
export function validateItemDraft(
  draft: NewItem,
): Result<NewItem, Fails<"invalid">> {
  const fields: Record<string, string> = {};
  if (!draft.name.trim() || draft.name.length > 120)
    fields.name = "Enter a name of up to 120 characters.";
  if (
    !draft.host ||
    draft.host.length > 253 ||
    !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(draft.host)
  )
    fields.host = "Enter a hostname using letters, numbers, dots or hyphens.";
  return Object.keys(fields).length
    ? err(invalid("Check the item details.", fields))
    : ok(draft);
}
const decodeDetail = responseDecoder("editable item", readEditableItem);
const decodeReceipt = responseDecoder("item save receipt", readItemReceipt);
const asRead = narrow("not_found"),
  asSave = narrow("invalid", "conflict", "not_found");
export async function readItem(
  client: HttpClient,
  id: string,
  options?: CallOptions,
) {
  const result = (
    await client.get<unknown>(`/items/${encodeURIComponent(id)}`, options)
  )
    .andThen((value) => decodeDetail(value, options?.trace))
    .mapErr(asRead);
  return result.ok && result.value.id !== id
    ? err(
        internal("The returned item did not match this address.", {
          type: "invalid_response",
        }),
      )
    : result;
}
export async function updateItem(
  client: HttpClient,
  attempt: ItemAttempt,
  options?: CallOptions,
): Promise<Result<ItemReceipt, ItemSaveFailure>> {
  const valid = validateItemDraft(attempt.draft);
  if (!valid.ok) return err(valid.error);
  const result = (
    await client.put<unknown>(`/items/${encodeURIComponent(attempt.id)}`, {
      ...options,
      body: attempt,
    })
  )
    .andThen((value) => decodeReceipt(value, options?.trace))
    .mapErr(asSave);
  if (
    result.ok &&
    (result.value.operationId !== attempt.operationId ||
      result.value.id !== attempt.id ||
      result.value.expectedRevision !== attempt.expectedRevision ||
      !sameItemDraft(result.value.draft, attempt.draft))
  ) {
    return err(
      internal("The receipt did not match the submitted item.", {
        type: "invalid_response",
      }),
    );
  }
  return result;
}
export async function findItemSave(
  client: HttpClient,
  operationId: string,
  options?: CallOptions,
): Promise<Result<ItemReceipt | null, TransportFailure>> {
  const result = await optional(
    (
      await client.get<unknown>(
        `/item-saves/${encodeURIComponent(operationId)}`,
        options,
      )
    )
      .andThen((value) => decodeReceipt(value, options?.trace))
      .mapErr(asRead),
    absentWhenType(NO_ITEM_SAVE),
  );
  return result.ok && result.value && result.value.operationId !== operationId
    ? err(
        internal("The receipt did not match the requested operation.", {
          type: "invalid_response",
        }),
      )
    : result;
}
