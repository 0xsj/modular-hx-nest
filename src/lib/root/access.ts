import { createMemoryClient } from "../http";
import { err, forbidden, ok, unavailable } from "../kernel";
import { readCapabilities, type Capability } from "../services/access";
import {
  readProtectedWorkspace,
  updateProtectedWorkspace,
} from "../services/example/protected-workspace";

/** An isolated authority simulator. Real roots replace this client with the
 * backend's authenticated transport; no role rules belong in the view. */
export function createAccessExample(subject: string, latencyMs = 200) {
  let revision = 1,
    view = true,
    edit = true,
    offline = false,
    updates = 0;
  const decision = (allowed: boolean): Capability =>
    allowed
      ? { allowed: true }
      : {
          allowed: false,
          reason:
            "Your access to this workspace was removed. Ask its owner to restore it.",
        };
  const client = createMemoryClient({
    latencyMs,
    routes: [
      {
        method: "GET",
        pattern: /^\/capabilities\/workspace$/,
        handle: () =>
          offline
            ? err(unavailable("The permission service cannot be reached."))
            : ok({
                subject,
                resource: "workspace",
                revision,
                grants: { view: decision(view), edit: decision(view && edit) },
              }),
      },
      {
        method: "GET",
        pattern: /^\/protected-workspace$/,
        handle: () =>
          view
            ? ok("Workspace: launch planning")
            : err(forbidden("You no longer have access to this workspace.")),
      },
      {
        method: "POST",
        pattern: /^\/protected-workspace$/,
        handle: () =>
          view && edit
            ? ok(`Update ${++updates} accepted by the demo authority.`)
            : err(
                forbidden(
                  "The server refused this action because your access changed.",
                ),
              ),
      },
    ],
  });
  return {
    permissions: (signal: AbortSignal) =>
      readCapabilities(client, subject, "workspace", { signal }),
    read: (signal: AbortSignal) => readProtectedWorkspace(client, { signal }),
    update: (signal: AbortSignal) =>
      updateProtectedWorkspace(client, { signal }),
    setAccess(nextView: boolean, nextEdit: boolean) {
      view = nextView;
      edit = nextEdit;
      revision++;
    },
    setOffline(value: boolean) {
      offline = value;
    },
  };
}
