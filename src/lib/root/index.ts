import { withChaos, type Plan } from "~/lib/chaos";
import { createFetchClient, createMemoryClient, type HttpClient, type MemoryRoute } from "~/lib/http";
import { routes as defaultRoutes } from "./fixtures";

export type RootOptions = {
  /** Absent means no server: everything is served from the route table. */
  baseUrl?: string;
  /** The bearer for this caller. Read once per root, not once per request. */
  token?: string | null;
  /** Overrides the shipped table. A caller that has its own fixtures — a test,
   *  a demo screen — supplies them here rather than editing the tier. */
  routes?: readonly MemoryRoute[];
  /** Ties every call made through this root together. Defaults to a fresh one. */
  correlationId?: string;
  /** Ignored entirely in a production build; see `~/lib/chaos`. */
  chaos?: Plan;
};

/** One root per interaction — per server render, per user action.
 *
 *  That is what makes the correlation id mean something: every call made
 *  through `client` shares it, so a page that fans out into four requests
 *  produces four failures that name the same interaction. Build a root per
 *  request and the id degenerates into a second request id. */
export type Root = {
  client: HttpClient;
  /** The id every call through this root carries. */
  correlationId: string;
  /** Transport-level PROVENANCE: did this come from a fixture or a server?
   *  A screen showing fixture data should be able to say so — *nobody looked*
   *  and *a fixture answered* are not the same claim. */
  usingFixtures: boolean;
  /** Whether a chaos plan is in force. A surface running under one must say so
   *  visibly: a forced failure that looks real is an afternoon wasted. */
  underChaos: boolean;
};

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `cid-${Math.random().toString(36).slice(2, 10)}`;

/** The ONLY function that picks an adapter.
 *
 *  It takes what it needs rather than reading it, so this tier imports no
 *  framework and travels to the sibling templates unchanged. Reading a cookie,
 *  a header or a query string is the caller's job — and the caller is the one
 *  place that differs per framework. */
export function createRoot(options: RootOptions = {}): Root {
  const correlationId = options.correlationId ?? newId();
  const token = options.token ?? null;
  const usingFixtures = !options.baseUrl;

  const base = usingFixtures
    ? createMemoryClient({
        routes: options.routes ?? defaultRoutes,
        getAccessToken: () => token,
        getCorrelationId: () => correlationId,
      })
    : createFetchClient({
        baseUrl: options.baseUrl!,
        getAccessToken: () => token,
        getCorrelationId: () => correlationId,
      });

  const client = withChaos(base, options.chaos, correlationId);

  return { client, correlationId, usingFixtures, underChaos: client !== base };
}

export { routes } from "./fixtures";
