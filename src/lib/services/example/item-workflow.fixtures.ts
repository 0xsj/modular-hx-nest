import {
  conflict,
  err,
  invalid,
  notFound,
  ok,
  type Result,
} from "../../kernel";
import {
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
  type MemoryRoute,
} from "../../http";
import {
  NO_ITEM_SAVE,
  readEditableItem,
  readItemAttempt,
  readItemReceipt,
  sameItemDraft,
  validateItemDraft,
  type EditableItem,
  type ItemReceipt,
} from "./item-workflow";

export type ItemDatabase = {
  generation: string;
  items: EditableItem[];
  receipts: ItemReceipt[];
};
export type ItemPersistence = {
  read(): Result<ItemDatabase>;
  write(value: ItemDatabase): Result<void>;
};
export const decodeItemDatabase = responseDecoder(
  "item database",
  (raw): ItemDatabase | undefined => {
    const value = responseObject(raw),
      items = responseArray(readEditableItem)(value?.items),
      receipts = responseArray(readItemReceipt)(value?.receipts);
    if (
      !value ||
      !responseText(value.generation) ||
      !items ||
      !receipts ||
      new Set(items.map((item) => item.id)).size !== items.length ||
      new Set(receipts.map((receipt) => receipt.operationId)).size !==
        receipts.length
    )
      return undefined;
    return { generation: value.generation, items, receipts };
  },
);
export function initialItems(generation: string): ItemDatabase {
  const names = [
    "API service",
    "Background jobs",
    "Billing",
    "Content service",
    "Delivery",
    "Events",
    "File storage",
    "Gateway",
    "Health checks",
    "Identity",
    "Job scheduler",
    "Knowledge base",
  ];
  const ids = [
    "api",
    "jobs",
    "billing",
    "content",
    "delivery",
    "events",
    "files",
    "gateway",
    "health",
    "identity",
    "scheduler",
    "knowledge",
  ];
  return {
    generation,
    receipts: [],
    items: names.map((name, i) => ({
      id: ids[i],
      name,
      host: `${ids[i]}.${i % 3 === 0 ? "internal" : "example.com"}`,
      revision: 1,
    })),
  };
}
export function createItemFixtures(persistence: ItemPersistence) {
  const routes: MemoryRoute[] = [
    {
      method: "GET",
      pattern: /^\/items$/,
      handle: () => persistence.read().map((data) => data.items),
    },
    {
      method: "GET",
      pattern: /^\/items\/([^/]+)$/,
      handle(_request, match) {
        return persistence.read().andThen((data) => {
          const item = data.items.find(
            (item) => item.id === decodeURIComponent(match[1]),
          );
          return item ? ok(item) : err(notFound("This item no longer exists."));
        });
      },
    },
    {
      method: "PUT",
      pattern: /^\/items\/([^/]+)$/,
      handle(request, match) {
        const attempt = readItemAttempt(request.body);
        if (!attempt || attempt.id !== decodeURIComponent(match[1]))
          return err(invalid("The save request is incomplete.", {}));
        const valid = validateItemDraft(attempt.draft);
        if (!valid.ok) return valid;
        return persistence.read().andThen((data) => {
          const previous = data.receipts.find(
            (receipt) => receipt.operationId === attempt.operationId,
          );
          if (previous)
            return previous.id === attempt.id &&
              previous.expectedRevision === attempt.expectedRevision &&
              sameItemDraft(previous.draft, attempt.draft)
              ? ok(previous)
              : err(
                  conflict("This operation id belongs to different changes."),
                );
          const current = data.items.find((item) => item.id === attempt.id);
          if (!current) return err(notFound("This item no longer exists."));
          if (current.revision !== attempt.expectedRevision)
            return err(
              conflict(
                "This item changed since you opened it. Review the saved version before continuing.",
                { type: "stale_revision" },
              ),
            );
          if (
            data.items.some(
              (item) =>
                item.id !== attempt.id &&
                item.host.toLowerCase() === attempt.draft.host.toLowerCase(),
            )
          )
            return err(
              invalid("This hostname is already in use.", {
                host: "Choose a hostname that is not assigned to another item.",
              }),
            );
          const item = {
            id: current.id,
            ...attempt.draft,
            revision: current.revision + 1,
          };
          const receipt: ItemReceipt = { ...attempt, item };
          const stored = persistence.write({
            ...data,
            items: data.items.map((value) =>
              value.id === item.id ? item : value,
            ),
            receipts: [...data.receipts, receipt],
          });
          return stored.ok ? ok(receipt) : err(stored.error);
        });
      },
    },
    {
      method: "GET",
      pattern: /^\/item-saves\/([^/]+)$/,
      handle(_request, match) {
        return persistence.read().andThen((data) => {
          const receipt = data.receipts.find(
            (receipt) => receipt.operationId === decodeURIComponent(match[1]),
          );
          return receipt
            ? ok(receipt)
            : err(
                notFound(
                  "This operation did not commit and cannot commit later.",
                  {
                    type: NO_ITEM_SAVE,
                  },
                ),
              );
        });
      },
    },
  ];
  return {
    routes,
    advance(id: string) {
      return persistence.read().andThen((data) => {
        const current = data.items.find((item) => item.id === id);
        if (!current) return err(notFound("This item no longer exists."));
        return persistence.write({
          ...data,
          items: data.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: `${item.name.slice(0, 95)} (updated elsewhere)`,
                  revision: item.revision + 1,
                }
              : item,
          ),
        });
      });
    },
  };
}
