import { err, ok, notFound } from "~/lib/kernel";
import type { MemoryRoute } from "~/lib/http";
import { NO_DEFAULT, type Item } from "~/lib/services/example";

/* This screen's fixtures. It supplies routes; it does not name an endpoint in a
   request — the service does that, which is the rule the tier exists for. */

const items: Item[] = [
  { id: "i1", name: "api", host: "api.example.com" },
  { id: "i2", name: "www", host: "www.example.com" },
];

export const routes: MemoryRoute[] = [
  { method: "GET", pattern: /^\/items$/, handle: () => ok(items) },
  {
    method: "GET",
    pattern: /^\/workspaces\/[^/]+\/default-item$/,
    // The refusal that MEANS absence, tagged so the service can recognise it.
    handle: () =>
      err(notFound("No default set.", { status: 404, type: NO_DEFAULT })),
  },
];
