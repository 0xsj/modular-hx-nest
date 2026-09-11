import type { HttpClient, RequestOptions } from "./port";

/** Surround the chosen adapter AND chaos. No trace means no recording. Paths,
 * headers and bodies stay in this tier; the trace sees only Result classification. */
export function withDiagnostics(inner: HttpClient): HttpClient {
  const request: HttpClient["request"] = <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ) =>
    options.trace
      ? options.trace.run("request", () =>
          inner.request<T>(method, path, options),
        )
      : inner.request<T>(method, path, options);
  return {
    request,
    get: (p, o) => request("GET", p, o),
    post: (p, o) => request("POST", p, o),
    put: (p, o) => request("PUT", p, o),
    patch: (p, o) => request("PATCH", p, o),
    delete: (p, o) => request("DELETE", p, o),
  };
}
