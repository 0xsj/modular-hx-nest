import {
  canceled,
  err,
  internal,
  ok,
  unauthenticated,
  type Failure,
  type Result,
} from "../kernel";
import type { ClientConfig, HttpClient, RequestOptions } from "./port";

/* The memory adapter reproduces the server's REFUSALS, not its happy path. A
 * refusal is a value a route hands back, identical in shape to the one the
 * fetch adapter builds from a real response.
 *
 * One change from v1/v2: an UNSERVED route is no longer a `not_found`. v1
 * reasoned "a route the fixture does not serve is a 404 from the real server
 * too", and that is true of the server — but the fixture not answering is a
 * fixture bug, not a server behaviour being reproduced. Labelling it 404 let
 * v2's `optional` turn a missing route into "looked and found nothing". It is
 * now `internal` with `type: "unserved_route"`: nobody looked, loudly. A
 * screen that wants to render a 404 registers a route that returns one.
 *
 * # It behaves like a server, not like a stub
 *
 * The point of the port is that a screen cannot tell which adapter answered it.
 * A fixture that resolves instantly, always succeeds and carries no metadata is
 * a fixture every screen is quietly built against — and the differences surface
 * on the day the real endpoint lands, which is the worst day to find them.
 *
 * So this one mints a REQUEST ID per attempt, takes a latency RANGE rather than
 * a constant, and lets a route say it is slower than the others. Each of those
 * is one line here and a class of defect that stops shipping. */

export const UNSERVED_ROUTE = "unserved_route";

/** Per ATTEMPT, and that is the whole distinction.
 *
 *  A correlation id names the interaction and is the same across every call a
 *  root makes; a request id names one call and is different on a retry. A
 *  fixture that mints neither leaves both undefined, at which point the
 *  distinction the failure model draws is invisible until production —
 *  see `decisions/0003`. */
const newRequestId = (): string =>
  `req_${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;

/** A fixed delay makes every loading state look identical and none of them look
 *  real. A range with jitter is what a caller will actually meet, and it is the
 *  difference between a skeleton somebody designed and a skeleton nobody saw. */
export type Latency = number | { min: number; max: number };

const delayFor = (latency: Latency | undefined): number => {
  if (latency === undefined) return 60 + Math.random() * 140;
  if (typeof latency === "number") return latency;
  return latency.min + Math.random() * Math.max(0, latency.max - latency.min);
};

export type MemoryRequest = {
  method: string;
  path: string;
  params: RequestOptions["params"];
  body: unknown;
  token: string | null;
  /** What the caller would have sent on the wire. A fixture that cannot see it
   *  cannot reproduce a server that reads it. */
  correlationId: string | undefined;
  /** Minted here, one per attempt. A route may quote it in a failure it builds;
   *  if it does not, the client attaches it on the way out. */
  requestId: string;
};

export type MemoryRoute = {
  method: string;
  pattern: RegExp;
  /** This route's own cost, when it differs. A search that scans and a read
   *  that hits an index do not take the same time, and a screen laid out
   *  against one uniform delay has never seen the shape it will really have. */
  latencyMs?: Latency;
  handle: (
    request: MemoryRequest,
    match: RegExpMatchArray,
  ) => Result<unknown, Failure> | Promise<Result<unknown, Failure>>;
};

export type MemoryConfig = {
  routes: readonly MemoryRoute[];
  getAccessToken?: ClientConfig["getAccessToken"];
  getCorrelationId?: ClientConfig["getCorrelationId"];
  /** Non-zero by default, and a RANGE by default: a fixture that resolves
   *  synchronously hides every loading state the real one will show, and one
   *  that resolves in a constant hides every layout shift. Defaults to
   *  60–200ms, which is roughly a healthy endpoint on a good connection. */
  latencyMs?: Latency;
};

/** Sleep, but abortable — because a real request in flight stops when the
 *  caller says so, not when it would have finished anyway.
 *
 *  A plain `setTimeout` await makes every cancellation arrive LATE: the check
 *  after it reports `canceled` correctly, and only once the full latency has
 *  elapsed. A screen that cancels on unmount then holds the work it cancelled
 *  for as long as it would have taken, which is exactly the thing cancelling
 *  was meant to avoid. */
function sleep(ms: number, signal?: AbortSignal): Promise<"done" | "aborted"> {
  if (signal?.aborted) return Promise.resolve("aborted");
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve("done");
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve("aborted");
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createMemoryClient(config: MemoryConfig): HttpClient {
  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<Result<T, Failure>> => {
    const correlationId = config.getCorrelationId?.() ?? undefined;
    const requestId = newRequestId();

    /* Matched BEFORE the wait, so a route can be slower than the others — and
       so an unserved path still costs a round trip, which is what a real 404
       does. */
    const route = config.routes.find(
      (r) => r.method === method && r.pattern.test(path),
    );

    /* The CALLER's setting wins. A route's latency is that endpoint's
       characteristic cost — the default shape — while a client-level value is
       an explicit instruction from whoever built the client, and a test asking
       for zero must get zero. Reversing these two turns `latencyMs: 0` into a
       suggestion and a suite into a wait. */
    if (
      (await sleep(
        delayFor(config.latencyMs ?? route?.latencyMs),
        options.signal,
      )) === "aborted"
    ) {
      return err(
        canceled("The request was cancelled.", { correlationId, requestId }),
      );
    }

    /* Identical to the network adapter: attach what the caller would have sent
       where the route did not set it. A fixture whose failures carry neither id
       is a fixture a screen can tell apart from the server. */
    const stamp = (f: Failure): Failure => {
      /* Only keys that have a value. Writing `correlationId: undefined` invents
         an own-property that was never there, which is invisible in a debugger
         and loud in an equality assertion. */
      const withIds = { ...f, requestId: f.requestId ?? requestId };
      const id = f.correlationId ?? correlationId;
      return id === undefined ? withIds : { ...withIds, correlationId: id };
    };

    if (!route) {
      return err(
        stamp(
          internal(`No fixture route for ${method} ${path}`, {
            type: UNSERVED_ROUTE,
          }),
        ),
      );
    }

    const answered = (await route.handle(
      {
        method,
        path,
        params: options.params,
        body: options.body,
        token: config.getAccessToken?.() ?? null,
        correlationId,
        requestId,
      },
      path.match(route.pattern)!,
    )) as Result<T, Failure>;

    return answered.ok ? answered : err(stamp(answered.error) as Failure);
  };

  return {
    request,
    get: (p, o) => request("GET", p, o),
    post: (p, o) => request("POST", p, o),
    put: (p, o) => request("PUT", p, o),
    patch: (p, o) => request("PATCH", p, o),
    delete: (p, o) => request("DELETE", p, o),
  };
}

/** A guard a route uses to reproduce the server's auth refusal rather than
 *  quietly succeeding. */
export const requireToken = (req: MemoryRequest): Result<string, Failure> =>
  req.token
    ? ok(req.token)
    : err(unauthenticated("Sign in to continue.", { status: 401 }));
