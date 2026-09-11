import { withChaos, type Plan } from "../chaos";
import {
  createFetchClient,
  createMemoryClient,
  withDiagnostics,
  type HttpClient,
  type Latency,
  type MemoryRoute,
} from "../http";
import { routes as defaultRoutes } from "./fixtures";

/** Every domain this application has.
 *
 *  A string union and nothing else, so this tier still imports no service and
 *  still travels to the siblings unchanged. A product edits the list. */
export type Domain = "session" | "ledger" | "example";

/** Every member, for a caller that wants them all. */
export const DOMAINS: readonly Domain[] = ["session", "ledger", "example"];

export type RootOptions = {
  /** Absent means no server at all: every domain is served from the route
   *  table, whatever `served` says. */
  baseUrl?: string;
  /** The domains the backend actually serves TODAY.
   *
   *  Two questions, not one. *Is there a backend* is a deployment fact and is
   *  `baseUrl`. *Is this domain finished* is a backend-readiness fact and is
   *  this — so a server can graduate one domain at a time while the rest stay
   *  on fixtures, and a screen built against an unfinished endpoint keeps
   *  working until the day it lands.
   *
   *  **Defaults to ALL of them**, so setting a base url does the obvious thing.
   *  Naming a subset is how a domain graduates: the ones listed go to the
   *  network, the rest stay on fixtures. Passing `[]` means none, which is a
   *  base url configured and deliberately unused. */
  served?: readonly Domain[];
  /** The bearer for this caller. Read once per root, not once per request. */
  token?: string | null;
  /** Overrides the shipped table. A caller that has its own fixtures — a test,
   *  a demo screen — supplies them here rather than editing the tier. */
  routes?: readonly MemoryRoute[];
  /** How slow the fixtures are. A range by default, because a constant hides
   *  every layout shift; zero in a test, because a suite is not a demo. */
  latencyMs?: Latency;
  /** Ties every call made through this root together. Defaults to a fresh one. */
  correlationId?: string;
  /** Ignored entirely in a production build; see `../chaos`. */
  chaos?: Plan;
};

/** One root per interaction — per server render, per client action.
 *
 *  That is what makes the correlation id mean something: every call made
 *  through it shares one, so a page that fans out into four requests produces
 *  four failures that name the same interaction. Build a root per request and
 *  the id degenerates into a second request id. */
export type Root = {
  /** The transport for one domain.
   *
   *  Per domain rather than one client, because *which adapter* is a per-domain
   *  question the moment a backend exists: the first endpoint to ship should
   *  not have to wait for the last. Every client here shares this root's
   *  correlation id, so the split changes nothing about what a failure names. */
  clientFor: (domain: Domain) => HttpClient;
  /** The id every call through this root carries. */
  correlationId: string;
  /** Transport-level PROVENANCE, per domain: did THIS come from a fixture or a
   *  server? A screen showing fixture data should be able to say so — "nobody
   *  looked" and "a fixture answered" are not the same claim. */
  usingFixtures: (domain: Domain) => boolean;
  /** Nothing is served by a backend at all. What a page-level banner asks. */
  allFixtures: boolean;
  /** Whether a chaos plan is in force. A surface running under one must say so
   *  visibly: a forced failure that looks real is an afternoon wasted. */
  underChaos: boolean;
};

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `cid-${Math.random().toString(36).slice(2, 10)}`;

/** The ONLY function that picks an adapter.
 *
 *  It takes what it needs rather than reading it, so this tier imports no
 *  framework and travels to the sibling templates unchanged. Reading a cookie,
 *  a header or a query string is the caller's job — and the caller is the one
 *  place that differs per framework. */
export function createRoot(options: RootOptions = {}): Root {
  const correlationId = options.correlationId ?? newId();
  const token = options.token ?? null;
  const served = options.served ?? DOMAINS;
  const hasBackend = Boolean(options.baseUrl);

  const usingFixtures = (domain: Domain): boolean =>
    !hasBackend || !served.includes(domain);

  /* Built once and shared. Two clients at most, whatever the domain count —
     and the fetch one is never constructed when there is no backend. */
  let memory: HttpClient | undefined;
  let network: HttpClient | undefined;
  let chaosApplied = false;

  const wrap = (client: HttpClient): HttpClient => {
    const wrapped = withChaos(client, options.chaos, correlationId);
    if (wrapped !== client) chaosApplied = true;
    return withDiagnostics(wrapped);
  };

  const clientFor = (domain: Domain): HttpClient => {
    if (usingFixtures(domain)) {
      memory ??= wrap(
        createMemoryClient({
          routes: options.routes ?? defaultRoutes,
          latencyMs: options.latencyMs,
          getAccessToken: () => token,
          getCorrelationId: () => correlationId,
        }),
      );
      return memory;
    }
    network ??= wrap(
      createFetchClient({
        baseUrl: options.baseUrl!,
        getAccessToken: () => token,
        getCorrelationId: () => correlationId,
      }),
    );
    return network;
  };

  /* Eager for the flag only: `underChaos` is read by surfaces that must warn
     before they render anything, and a lazily-built client would leave it false
     until the first call. */
  clientFor(DOMAINS[0]);

  return {
    clientFor,
    correlationId,
    usingFixtures,
    allFixtures: !hasBackend || served.length === 0,
    underChaos: chaosApplied,
  };
}

export { routes } from "./fixtures";
