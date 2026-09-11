import { query, redirect } from "@solidjs/router";
import { serverRoot, currentSession } from "../server/root";
import { listSessions } from "../services/session";
import { listItems, type Item } from "../services/example";
import { createRoot } from "../root";
import { parsePlan } from "../chaos";
import { presenceOf, err, ok, forbidden } from "../kernel";
import type { MemoryRoute } from "../http";
import { authHref } from "~/lib/app/return-to";
export const getDashboard = query(async (search: string) => {
  "use server";
  const session = await currentSession(search);
  if (session.state === "empty")
    throw redirect(authHref("/sign-in", `/cookbook/dashboard${search}`));
  if (session.state === "unmeasured")
    return { state: "failed", failure: session.failure } as const;
  const root = serverRoot(search);
  const presence = presenceOf(
    (await listSessions(root.clientFor("session"))).map((all) => {
      const others = all.filter((s) => !s.current);
      return others.length ? others : null;
    }),
  );
  return {
    state: "ready",
    user: session.value,
    presence,
    root: {
      fixtures: root.usingFixtures("session"),
      underChaos: root.underChaos,
      correlationId: root.correlationId,
    },
  } as const;
}, "flover-dashboard");
export const getFailureExample = query(async (search: string) => {
  "use server";
  const session = await currentSession(search);
  if (session.state === "empty")
    throw redirect(authHref("/sign-in", `/cookbook/failures${search}`));
  if (session.state === "unmeasured")
    return { state: "failed", failure: session.failure } as const;
  const root = serverRoot(search);
  const answer = await listSessions(root.clientFor("session"));
  return {
    state: "ready",
    failure: answer.ok ? null : answer.error,
    count: answer.ok ? answer.value.length : null,
    forced: new URLSearchParams(search).get("chaos"),
    root: { correlationId: root.correlationId },
  } as const;
}, "flover-failure-example");
const probeRoutes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/items$/,
    handle: (req) =>
      req.params?.workspace === "locked"
        ? err(forbidden("Not your workspace.", { status: 403 }))
        : ok([
            { id: "i1", name: "api", host: "api.example.com" },
            { id: "i2", name: "www", host: "www.example.com" },
          ] satisfies Item[]),
  },
];
export const getProbe = query(async (search: string) => {
  "use server";
  const params = new URLSearchParams(search);
  const root = createRoot({
    routes: probeRoutes,
    baseUrl: process.env.API_BASE_URL || undefined,
    chaos: import.meta.env.DEV ? parsePlan(params) : undefined,
  });
  const result = await listItems(
    root.clientFor("example"),
    params.get("workspace") ?? "w1",
  );
  return {
    presence: presenceOf(result.map((rows) => (rows.length ? rows : null))),
    root: {
      fixtures: root.usingFixtures("example"),
      underChaos: root.underChaos,
      correlationId: root.correlationId,
    },
  };
}, "flover-probe");
