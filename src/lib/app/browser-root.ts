import { createRoot } from "~/lib/root";
import { parsePlan } from "~/lib/chaos";
/** Queries are enabled in the browser; its transport calls same-origin BFF
 * handlers. The cookie stays HttpOnly and never enters a client root. */
export function useBrowserRoot() {
  return createRoot({
    baseUrl: `${globalThis.location?.origin ?? ""}/api`,
    chaos: import.meta.env.DEV
      ? parsePlan(globalThis.location?.search ?? "")
      : undefined,
  });
}
