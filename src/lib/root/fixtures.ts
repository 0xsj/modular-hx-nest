import type { MemoryRoute } from "~/lib/http";

/* The route table the in-memory adapter serves.
 *
 * EMPTY, and that is correct for a template: there is no domain here, so there
 * is nothing a fixture could honestly reproduce. Every request therefore comes
 * back as an unserved route — `internal` carrying `unserved_route` — which says
 * *this fixture was never asked* rather than pretending the server answered.
 *
 * A product fills this in, and the rule it inherits is the one that makes
 * fixtures worth having: reproduce the server's REFUSALS, not only its happy
 * path. Count the routes that succeed against the routes that refuse; if the
 * second number is zero, every screen built against this is built against a
 * contract nobody serves. */
export const routes: MemoryRoute[] = [];
