import { canceled, err, internal, ok, unauthenticated, type Failure, type Result } from "~/lib/kernel";
import type { ClientConfig, HttpClient, RequestOptions } from "./port";

/* The fixture transport. Specification: `adapters.doc.ts`; clause numbers cite
 * it.
 *
 * It reproduces the server's REFUSALS, not its happy path. A refusal is a
 * value a route hands back, identical in shape to the one the fetch adapter
 * builds from a real response — which is A21, the reason the pair exists. */

/** A18 — the marker on the one failure this adapter invents. An unserved route
 *  is the FIXTURE being incomplete, never the server saying "not there". See
 *  `adapters.doc.ts` §4 for why this departs from `protocols/fixtures.md` §3. */
export const UNSERVED_ROUTE = "unserved_route";

const DEFAULT_LATENCY_MS = 40;

export type MemoryRequest = {
  method: string;
  path: string;
  params: RequestOptions["params"];
  body: unknown;
  /** A16 — what the client would have sent. A fixture that cannot see the
   *  bearer cannot reproduce a server that reads it, and every route would
   *  have to answer for one imaginary caller. */
  token: string | null;
  correlationId: string | undefined;
};

export type MemoryRoute = {
  method: string;
  pattern: RegExp;
  handle: (
    request: MemoryRequest,
    match: RegExpMatchArray,
  ) => Result<unknown, Failure> | Promise<Result<unknown, Failure>>;
};

export type MemoryConfig = {
  routes: readonly MemoryRoute[];
  getAccessToken?: ClientConfig["getAccessToken"];
  getCorrelationId?: ClientConfig["getCorrelationId"];
  /** A14 — non-zero by default. A fixture that resolves synchronously makes
   *  every pending branch unreachable, and unreachable branches rot. */
  latencyMs?: number;
};

/** A20 — identical to the fetch adapter's. A fixture whose failures carry no
 *  correlation is a fixture a screen could tell apart from the server. */
function withCorrelation(failure: Failure, correlationId: string | undefined): Failure {
  if (failure.correlationId !== undefined || correlationId === undefined) return failure;
  return { ...failure, correlationId };
}

export function createMemoryClient(config: MemoryConfig): HttpClient {
  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<Result<T, Failure>> => {
    const correlationId = config.getCorrelationId?.() || undefined;

    await new Promise((resolve) => setTimeout(resolve, config.latencyMs ?? DEFAULT_LATENCY_MS));

    /* A17 — the caller gave up while we were pretending to be slow. */
    if (options.signal?.aborted) {
      return err(withCorrelation(canceled("The request was cancelled."), correlationId));
    }

    /* A15 — in order; the first match handles it and the rest are not tried. */
    for (const route of config.routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (!match) continue;

      const answered = (await route.handle(
        {
          method,
          path,
          params: options.params,
          body: options.body,
          token: config.getAccessToken?.() || null,
          correlationId,
        },
        match,
      )) as Result<T, Failure>;

      /* A19/A20 — unchanged, apart from the correlation attach, and a success
         is never touched. */
      return answered.ok ? answered : err(withCorrelation(answered.error, correlationId));
    }

    /* A18 — loud, and named as ours. Not a crash, not an empty success, and
       not a 404: nobody looked, rather than looked and found nothing. */
    return err(
      internal(`No fixture route for ${method} ${path}`, {
        type: UNSERVED_ROUTE,
        correlationId,
      }),
    );
  };

  return {
    request,
    get: (path, options) => request("GET", path, options),
    post: (path, options) => request("POST", path, options),
    put: (path, options) => request("PUT", path, options),
    patch: (path, options) => request("PATCH", path, options),
    delete: (path, options) => request("DELETE", path, options),
  };
}

/** The guard a route uses to reproduce the server's auth refusal rather than
 *  quietly succeeding — A21, at the level a fixture author actually writes. */
export const requireToken = (request: MemoryRequest): Result<string, Failure> =>
  request.token
    ? ok(request.token)
    : err(unauthenticated("Sign in to continue.", { status: 401 }));
