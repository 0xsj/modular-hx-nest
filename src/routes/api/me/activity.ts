import type { APIEvent } from "@solidjs/start/server";
import { getMyActivity } from "~/lib/services/ledger";
import { serverRoot } from "~/lib/server/root";
import { respond } from "~/lib/server/respond";
export async function GET(event: APIEvent) {
  const root = serverRoot(),
    query = new URL(event.request.url).searchParams;
  return respond(
    await getMyActivity(root.clientFor("ledger"), {
      after: query.get("after") ?? undefined,
      facet: query.get("facet") ?? undefined,
      correlation: query.get("correlation") ?? undefined,
    }),
    root.correlationId,
  );
}
