import { err, internal, ok, type Failure, type Result } from "../kernel";
import { failureFromResponse, failureFromTransport } from "./envelope";
import {
  CORRELATION_HEADER,
  joinUrl,
  queryString,
  type ClientConfig,
  type HttpClient,
  type RequestOptions,
} from "./port";

const DEFAULT_TIMEOUT = 15_000;

function url(
  baseUrl: string,
  path: string,
  params: RequestOptions["params"],
): string {
  const u = new URL(joinUrl(baseUrl, path));
  for (const [key, value] of new URLSearchParams(queryString(params))) {
    u.searchParams.set(key, value);
  }
  return u.toString();
}

/** The correlation id we SENT, attached when the response did not echo one.
 *
 *  A server that ignores the header is the common case, and a failure that
 *  cannot name its own interaction is exactly the failure you most want to
 *  trace. What the server echoed always wins — it saw the request. */
function withCorrelation(
  failure: Failure,
  correlationId: string | undefined,
): Failure {
  if (failure.correlationId !== undefined) return failure; // the server's echo wins
  if (correlationId === undefined) return failure;
  return { ...failure, correlationId };
}

/** Never throws. Every exit is a Result — the port's contract, and the only
 *  reason a service can be one line. */
export function createFetchClient(config: ClientConfig): HttpClient {
  const decode = config.decodeFailure ?? failureFromResponse;

  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<Result<T, Failure>> => {
    /* `AbortSignal.timeout` aborts with a TimeoutError, so a timeout arrives as
       `timeout`. v1 aborted a controller by hand, which produces an AbortError
       — every timeout was classified `canceled`, and `canceled` is not
       retried. Combined with the caller's signal, not replaced. */
    const signals = [
      AbortSignal.timeout(
        options.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT,
      ),
    ];
    if (options.signal) signals.push(options.signal);

    const correlationId = config.getCorrelationId?.() ?? undefined;

    let response: Response;
    try {
      const token = config.getAccessToken?.();
      response = await fetch(url(config.baseUrl, path, options.params), {
        method,
        signal: AbortSignal.any(signals),
        headers: {
          ...(options.body === undefined
            ? {}
            : { "content-type": "application/json" }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(correlationId ? { [CORRELATION_HEADER]: correlationId } : {}),
          ...options.headers,
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (cause) {
      return err(withCorrelation(failureFromTransport(cause), correlationId));
    }

    if (!response.ok)
      return err(withCorrelation(await decode(response), correlationId));
    if (response.status === 204) return ok(undefined as T);

    /* Parsed separately from the fetch: a body that is not JSON on a 200 is OUR
       problem, not the network's, and folding it into the transport catch would
       label a contract break "unavailable" and make it look retryable. */
    try {
      return ok((await response.json()) as T);
    } catch {
      return err(
        internal("The server's response could not be read.", {
          status: response.status,
        }),
      );
    }
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
