import type { Failure, Result } from "../kernel";
import type { DiagnosticTrace } from "../diagnostics";

/** Turn a non-2xx response into exactly one Failure. TOTAL — it must never
 *  throw. The envelope ships one for the problem document this template
 *  expects; a product with a different backend passes its own and edits
 *  nothing in this tier. Still the only place a wire key is read by name. */
export type FailureDecoder = (response: Response) => Promise<Failure>;

export type ClientConfig = {
  /** Origin plus any mount path. A trailing slash is ignored; request paths are
   *  appended, never resolved against it. */
  baseUrl: string;
  timeoutMs?: number;
  /** Read lazily on every request, so a refreshed token is picked up without
   *  rebuilding the client. */
  getAccessToken?: () => string | null | undefined;
  /** Defaults to the envelope's `failureFromResponse`. */
  decodeFailure?: FailureDecoder;
  /** The id of the interaction this client's requests belong to. Read LAZILY on
   *  every request, exactly like the token, so a new interaction is picked up
   *  without rebuilding the client.
   *
   *  Optional and undefined by default. Minting one needs somewhere to hold
   *  "the current interaction". Runtime roots supply this explicitly rather
   *  than relying on a mutable global. Returning undefined sends no
   *  header and changes nothing. */
  getCorrelationId?: () => string | null | undefined;
};

/** The one place these strings exist. `lib/http` is the only tier permitted to
 *  name a header, so switching to `traceparent` for a product with a tracing
 *  stack is a one-line change, here. */
export const CORRELATION_HEADER = "x-correlation-id";
export const REQUEST_ID_HEADER = "x-request-id";

/** What a CALLER may pass to a service.
 *
 *  Deliberately a strict subset of `RequestOptions`: a caller may cancel or
 *  attach an explicit diagnostic trace, and
 *  may not set a header, a path or a query — those belong to the service, which
 *  is the only tier permitted to name them. Without this a request cannot be
 *  cancelled at all from above the transport, which makes the `canceled` kind
 *  unreachable however carefully every tier defends it. */
export type CallOptions = { signal?: AbortSignal; trace?: DiagnosticTrace };

export type RequestOptions = {
  /** Explicit per-action context; never a mutable global current request. */
  trace?: DiagnosticTrace;
  /** `undefined` values are dropped rather than sent as the string "undefined". */
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** The caller's own cancellation. Combined with the timeout, not replaced. */
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

/** Raw transport values. A generic parameter is only a TypeScript assertion,
 *  never runtime validation: services request <unknown> and use a response
 *  decoder before exposing a domain value. See response.doc.ts.
 *  The transport can produce ANY failure. Narrowing is a service's job. */
export type HttpClient = {
  request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<Result<T, Failure>>;
  get<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  post<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  put<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  patch<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  delete<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<Result<T, Failure>>;
};

/** H4 — append, never resolve. `new URL(path, base)` would treat a leading
 *  slash as absolute and silently drop the mount path. */
export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/** H3 — drop `undefined`, encode the rest, and return nothing at all when there
 *  is nothing to append (rather than a bare `?`). */
export function queryString(params: RequestOptions["params"]): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
