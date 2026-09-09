import { err, internal, ok, type Failure, type Result } from "~/lib/kernel";
import { failureFromResponse, failureFromTransport } from "./envelope";
import { CORRELATION_HEADER, type ClientConfig, type HttpClient, type RequestOptions } from "./port";

/* The real transport. Specification: `adapters.doc.ts`; clause numbers cite it. */

const DEFAULT_TIMEOUT_MS = 15_000;

/** A3/A4 — the path is APPENDED, never resolved against the base. Resolving
 *  would discard a mount path: `new URL("/v1/me", "https://h/api")` is
 *  `https://h/v1/me`, and the `/api` is gone without a word. */
function requestUrl(baseUrl: string, path: string, params: RequestOptions["params"]): string {
  const base = baseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** A20 — the id we SENT, attached when the answer did not carry one. A server
 *  that ignores the header is the common case, and a failure that cannot name
 *  its own interaction is exactly the one you most want to trace. What the
 *  answer already carries always wins: it saw the request. */
function withCorrelation(failure: Failure, correlationId: string | undefined): Failure {
  if (failure.correlationId !== undefined || correlationId === undefined) return failure;
  return { ...failure, correlationId };
}

export function createFetchClient(config: ClientConfig): HttpClient {
  const decode = config.decodeFailure ?? failureFromResponse;

  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<Result<T, Failure>> => {
    /* A5 — `AbortSignal.timeout` raises TimeoutError; a controller aborted by
       hand raises AbortError, which is what the caller's own cancellation
       raises. Hand-rolling would make every timeout classify as `canceled`,
       and a cancellation is never retried. The caller's signal is COMBINED,
       not replaced. */
    const signals: AbortSignal[] = [
      AbortSignal.timeout(options.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    ];
    if (options.signal) signals.push(options.signal);

    const correlationId = config.getCorrelationId?.() || undefined;
    const token = config.getAccessToken?.() || undefined;

    let response: Response;
    try {
      response = await fetch(requestUrl(config.baseUrl, path, options.params), {
        method,
        signal: AbortSignal.any(signals),
        headers: {
          /* A6/A7/A8 — each present only when it has something to say. */
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(correlationId ? { [CORRELATION_HEADER]: correlationId } : {}),
          /* A9 — the caller's headers land last and win. */
          ...options.headers,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (cause) {
      /* A13 */
      return err(withCorrelation(failureFromTransport(cause), correlationId));
    }

    /* A10 */
    if (!response.ok) return err(withCorrelation(await decode(response), correlationId));

    /* A11 — nothing to parse. */
    if (response.status === 204) return ok(undefined as T);

    /* A12 — OUTSIDE the transport catch on purpose. Folded in, a contract
       break would be labelled `unavailable`, which is retryable, and the
       client would hammer an endpoint answering fine with the wrong shape. */
    try {
      return ok((await response.json()) as T);
    } catch {
      return err(
        withCorrelation(
          internal("The server's response could not be read.", { status: response.status }),
          correlationId,
        ),
      );
    }
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
