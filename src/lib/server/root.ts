import "server-only";
import { getRequestEvent } from "solid-js/web";
import { getCookie, setCookie, deleteCookie } from "@solidjs/start/http";
import { createRoot, DOMAINS, type Root } from "~/lib/root";
import { currentUser, sessionRoutes, type User } from "~/lib/services/session";
import { ledgerRoutes } from "~/lib/services/ledger";
import { parsePlan } from "~/lib/chaos";
import type { Presence, TransportFailure } from "~/lib/kernel";
export const SESSION_COOKIE = "flover_solid_session";
type Session = Presence<User, TransportFailure>;
type Locals = {
  roots?: Map<string, Root>;
  sessions?: Map<string, Promise<Session>>;
};
function locals(): Locals {
  const event = getRequestEvent();
  if (!event) throw new Error("A server root requires a request");
  return event.locals;
}
export function serverRoot(search?: string): Root {
  const event = getRequestEvent()!;
  const query = search ?? new URL(event.request.url).search;
  const state = locals();
  state.roots ??= new Map();
  let root = state.roots.get(query);
  if (!root) {
    root = createRoot({
      baseUrl: process.env.API_BASE_URL || undefined,
      served:
        process.env.API_SERVED_DOMAINS === undefined
          ? undefined
          : DOMAINS.filter((d) =>
              process.env
                .API_SERVED_DOMAINS!.split(",")
                .map((v) => v.trim())
                .includes(d),
            ),
      token: getCookie(SESSION_COOKIE) ?? null,
      routes: [...sessionRoutes, ...ledgerRoutes],
      chaos: import.meta.env.DEV ? parsePlan(query) : undefined,
    });
    state.roots.set(query, root);
  }
  return root;
}
export function currentSession(search = ""): Promise<Session> {
  const state = locals();
  state.sessions ??= new Map();
  let session = state.sessions.get(search);
  if (!session) {
    session = (async () => {
      if (!getCookie(SESSION_COOKIE)) return { state: "empty" } as const;
      const result = await currentUser(serverRoot(search).clientFor("session"));
      if (result.ok) return { state: "found", value: result.value } as const;
      return result.error.kind === "unauthenticated"
        ? ({ state: "empty" } as const)
        : ({ state: "unmeasured", failure: result.error } as const);
    })();
    state.sessions.set(search, session);
  }
  return session;
}
export function startSession(token: string) {
  setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(getRequestEvent()!.request.url).protocol === "https:",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export function endSession() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
