import { CORRELATION_HEADER } from "~/lib/http";
import type { Failure, Result } from "~/lib/kernel";

/* The one place a Result becomes a wire response.
 *
 * The route handlers exist because the session cookie is HttpOnly: the browser
 * holds no bearer, so it asks this application rather than the API. That only
 * works if what comes back is decodable by the SAME `lib/http` envelope the
 * fetch adapter uses — so the shape is written once, here, and not per handler.
 *
 * Two handlers with two hand-written serialisers is two vocabularies for one
 * failure, and the second one is always slightly wrong in a way that decodes to
 * `internal` with the message lost. */
export function respond<T>(
  answered: Result<T, Failure>,
  correlationId: string,
): Response {
  const headers = { [CORRELATION_HEADER]: correlationId };

  if (answered.ok) {
    /* 204 for a write that returns nothing. A `null` body with a 200 forces
       every caller to decide what an empty success means. */
    return answered.value === null || answered.value === undefined
      ? new Response(null, { status: 204, headers })
      : Response.json(answered.value, { headers });
  }

  const failure = answered.error;
  return Response.json(
    {
      /* Flat, with `kind` at the top level — the problem document
         `lib/http/envelope.ts` reads. Metadata in snake_case, which that file
         accepts alongside camelCase. */
      kind: failure.kind,
      message: failure.message,
      type: failure.type,
      correlation_id: failure.correlationId ?? correlationId,
      request_id: failure.requestId,
      ...(failure.kind === "rate_limited"
        ? { retry_after: failure.retryAfter }
        : {}),
      ...(failure.kind === "invalid" ? { fields: failure.fields } : {}),
    },
    /* The REAL status, so a proxy, a log and a devtools panel agree with the
       body — and so a decoder with no body to read classifies it the same way. */
    { status: failure.status ?? 500, headers },
  );
}
