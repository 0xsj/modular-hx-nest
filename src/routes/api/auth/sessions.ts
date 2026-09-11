import { listSessions } from "~/lib/services/session";
import { serverRoot } from "~/lib/server/root";
import { respond } from "~/lib/server/respond";
export async function GET() {
  const root = serverRoot();
  return respond(
    await listSessions(root.clientFor("session")),
    root.correlationId,
  );
}
