import { err, notFound, ok } from "~/lib/kernel";
import type { MemoryRoute } from "~/lib/http";
import { NO_DEFAULT, type Item } from "~/lib/services/example";

/* This screen's fixtures. It supplies ROUTES; it does not name an endpoint in a
 * request — the service does that, which is the rule the tier exists for.
 *
 * No default export: a file under `src/routes` becomes a route only if it has
 * one. */

const items: Item[] = [
  { id: "i1", name: "api", host: "api.example.com" },
  { id: "i2", name: "www", host: "www.example.com" },
];

export const routes: MemoryRoute[] = [
  { method: "GET", pattern: /^\/items$/, handle: () => ok(items) },
  { method: "GET", pattern: /^\/items\/i1$/, handle: () => ok(items[0]) },
  {
    method: "GET",
    pattern: /^\/workspaces\/[^/]+\/default-item$/,
    /* The refusal that MEANS absence, tagged so the service can recognise it.
       An untagged 404 here would be a fault, not an emptiness. */
    handle: () => err(notFound("No default set.", { status: 404, type: NO_DEFAULT })),
  },
];
