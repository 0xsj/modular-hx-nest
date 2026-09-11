import type { APIEvent } from "@solidjs/start/server";
import { revokeSession } from "~/lib/services/session";
import { serverRoot } from "~/lib/server/root";
import { respond } from "~/lib/server/respond";
export async function DELETE(event: APIEvent) {
  const root = serverRoot();
  return respond(
    await revokeSession(root.clientFor("session"), event.params.id),
    root.correlationId,
  );
}
