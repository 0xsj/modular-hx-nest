import {
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
  responseTimestamp,
} from "../../http";
import type { AuditEntry, AuditPage } from "./ledger.types";

function readEntry(value: unknown): AuditEntry | undefined {
  const entry = responseObject(value);
  if (
    !entry ||
    !responseText(entry.id) ||
    !responseText(entry.action) ||
    !responseText(entry.subject) ||
    !responseText(entry.actor) ||
    !responseText(entry.correlation_id) ||
    !responseTimestamp(entry.occurred_at) ||
    (entry.scope !== "system" &&
      entry.scope !== "account" &&
      entry.scope !== "session")
  )
    return undefined;
  const detail = responseObject(entry.detail);
  if (!detail) return undefined;
  return {
    id: entry.id,
    action: entry.action,
    subject: entry.subject,
    actor: entry.actor,
    scope: entry.scope,
    correlation_id: entry.correlation_id,
    occurred_at: entry.occurred_at,
    detail: { ...detail },
  };
}

const readEntries = responseArray(readEntry);
const readFacets = responseArray(
  (value): { facet: string; total: number } | undefined => {
    const item = responseObject(value);
    if (
      !item ||
      !responseText(item.facet) ||
      typeof item.total !== "number" ||
      !Number.isSafeInteger(item.total) ||
      item.total < 0
    )
      return undefined;
    return { facet: item.facet, total: item.total };
  },
);

export const decodeAuditPage = responseDecoder(
  "activity page",
  (value): AuditPage | undefined => {
    const page = responseObject(value);
    if (!page) return undefined;
    const entries = readEntries(page.entries);
    if (!entries || (page.next !== undefined && !responseText(page.next)))
      return undefined;
    const facets =
      page.facets === undefined ? undefined : readFacets(page.facets);
    if (page.facets !== undefined && facets === undefined) return undefined;
    return {
      entries,
      ...(page.next === undefined ? {} : { next: page.next as string }),
      ...(facets === undefined ? {} : { facets }),
    };
  },
);
