import type { Failure, Result } from "~/lib/kernel";

/** Turn a non-2xx response into exactly one `Failure`. TOTAL — it must never
 *  throw. The envelope ships one for the problem document this template
 *  expects; a product whose backend speaks differently passes its own and
 *  edits nothing in this tier. Still the only place a wire key is read by
 *  name. */
export type FailureDecoder = (response: Response) => Promise<Failure>;

export type ClientConfig = {
  /** Origin plus any mount path. A trailing slash is ignored; request paths
   *  are appended, never resolved against it. */
  baseUrl: string;
  timeoutMs?: number;
  /** Read LAZILY on every request, so a refreshed token is picked up without
   *  rebuilding the client. */
  getAccessToken?: () => string | null | undefined;
  /** Defaults to the envelope's decoder. Replacing it is how a product adopts
   *  a backend that speaks a different problem shape. */
  decodeFailure?: FailureDecoder;
  /** The interaction these requests belong to. Read lazily, exactly like the
   *  token. Optional and undefined by default: minting one needs somewhere to
   *  hold *the current interaction*, which is `lib/runtime` and is unbuilt —
   *  so the SEAM ships and the originator does not. Returning undefined sends
   *  no header and changes nothing. */
  getCorrelationId?: () => string | null | undefined;
};

/** The only place these strings exist. `lib/http` is the only tier permitted
 *  to name a header, so moving to a tracing standard is a change here and
 *  nowhere else. */
export const CORRELATION_HEADER = "x-correlation-id";
export const REQUEST_ID_HEADER = "x-request-id";

/** What a CALLER of a service passes down — not what the transport accepts.
 *
 *  A service takes this and forwards the signal; it does not take params,
 *  headers or a body, because those are the service's own business and a
 *  caller supplying them would be naming an endpoint's shape from above.
 *
 *  It exists so a signal can reach the transport at all. Without it nothing
 *  above `lib/http` can supply one, and `canceled` is a kind the client can
 *  produce and no caller can ever cause. */
export type CallOptions = {
  signal?: AbortSignal;
};

export type RequestOptions = {
  /** `undefined` values are dropped rather than sent as the string
   *  "undefined", so an absent cursor passes straight through. */
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** The caller's own cancellation. COMBINED with the timeout, never
   *  replacing it. */
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

/** The port. Everything above depends on this TYPE and never on an
 *  implementation of it — `lib/root` is the only place that picks one.
 *
 *  It returns a `Result` rather than throwing: an HTTP call failing is
 *  routine, not exceptional, so it belongs in the type. See
 *  `flover-solid ADR 0003`.
 *
 *  The failure type is the WHOLE union, because the transport can produce any
 *  of them. Narrowing is a service's job, and after the split it only ever
 *  decides domain kinds. */
export type HttpClient = {
  request<T>(method: string, path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  get<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  post<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  put<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  patch<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
  delete<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
};
