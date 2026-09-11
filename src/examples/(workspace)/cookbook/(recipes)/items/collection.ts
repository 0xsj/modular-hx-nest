import {
  choiceParam,
  integerParam,
  querySchema,
  textParam,
} from "~/lib/url-state";
import type { Item } from "~/lib/services/example";

export const itemQuery = querySchema({
  q: textParam({ maxLength: 80 }),
  scope: choiceParam(["all", "internal", "public"], "all"),
  sort: choiceParam(["name", "host"], "name"),
  page: integerParam(),
  item: textParam({ maxLength: 100 }),
});
export type ItemView = typeof itemQuery.defaults;
export const PAGE_SIZE = 5;
export function selectItems(items: readonly Item[], view: ItemView) {
  const matches = items.filter(
    (item) =>
      `${item.name} ${item.host}`
        .toLowerCase()
        .includes(view.q.toLowerCase()) &&
      (view.scope === "all" ||
        item.host.toLowerCase().endsWith(".internal") ===
          (view.scope === "internal")),
  );
  matches.sort(
    (a, b) =>
      a[view.sort].localeCompare(b[view.sort]) || a.id.localeCompare(b.id),
  );
  return {
    total: matches.length,
    pages: Math.ceil(matches.length / PAGE_SIZE),
    rows: matches.slice((view.page - 1) * PAGE_SIZE, view.page * PAGE_SIZE),
  };
}
