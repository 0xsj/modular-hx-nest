import { err, forbidden, ok } from "../../kernel";
import type { MemoryRoute } from "../../http";
import type { Item } from "./example.types";
/** Isolated public probe fixtures. A refusal is part of the contract. */
export const probeRoutes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/items$/,
    handle: (request) =>
      request.params?.workspace === "locked"
        ? err(forbidden("Not your workspace.", { status: 403 }))
        : ok([
            { id: "i1", name: "api", host: "api.example.com" },
            { id: "i2", name: "www", host: "www.example.com" },
          ] satisfies Item[]),
  },
];
