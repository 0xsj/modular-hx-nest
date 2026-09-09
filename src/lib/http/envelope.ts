import {
  canceled,
  isFailureKind,
  timeout,
  unavailable,
  type Failure,
  type FailureKind,
  type FailureMeta,
} from "~/lib/kernel";
import { CORRELATION_HEADER, REQUEST_ID_HEADER, type FailureDecoder } from "./port";

/* The only file permitted to name a wire key, a header or a status code. The
 * specification is `envelope.doc.ts`; clause numbers below cite it.
 *
 * This is the DEFAULT decoder, not the only one — `ClientConfig.decodeFailure`
 * replaces it for a backend that speaks differently. */

/** The problem document this client expects. Flat: `kind` is top level. Every
 *  field is `unknown`, because a wire is not a type. `detail` and `title` are
 *  read as message fallbacks so a standard problem document works without a
 *  custom decoder. */
type Problem = {
  kind?: unknown;
  message?: unknown;
  detail?: unknown;
  title?: unknown;
  type?: unknown;
  fields?: unknown;
  request_id?: unknown;
  correlation_id?: unknown;
  retry_after?: unknown;
};

/** E6 — the map is to BEHAVIOUR, not to RFC meanings. Two statuses calling for
 *  the same client reaction are one kind, which is why there are ten kinds and
 *  not thirteen. */
function kindFromStatus(status: number): FailureKind {
  switch (status) {
    case 400: return "invalid";
    case 401: return "unauthenticated";
    case 403: return "forbidden";
    case 404: return "not_found";
    case 409: return "conflict";
    case 412: return "conflict";
    case 422: return "invalid";
    case 428: return "invalid";
    case 429: return "rate_limited";
    case 499: return "canceled";
    case 503: return "unavailable";
    case 504: return "timeout";
    default: return "internal";
  }
}

/** E8 — an empty string is treated as absent, so a server sending `""` falls
 *  through to the next candidate rather than producing a nameless failure. */
const str = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/** E12 — zero is a value. A truthiness check here would silently drop a
 *  `Retry-After: 0`, which means "try again now" and not "no answer". */
const num = (value: unknown): number | undefined => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

/** E11 — only string-valued entries survive. A `fields` that is missing, null,
 *  an array or a scalar yields `{}` rather than propagating a shape a form
 *  cannot render. */
function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

/** E13 — assembling the right variant. `fields` is built only for `invalid`
 *  and `retryAfter` only for `rate_limited`, so the union makes getting it
 *  wrong a type error rather than a convention. */
function build(kind: FailureKind, meta: FailureMeta, problem: Problem, response: Response): Failure {
  if (kind === "invalid") return { kind, ...meta, fields: stringMap(problem.fields) };
  if (kind === "rate_limited") {
    const retryAfter = num(problem.retry_after) ?? num(response.headers.get("retry-after"));
    return retryAfter === undefined
      ? { kind, ...meta }
      : { kind, ...meta, retryAfter };
  }
  return { kind, ...meta };
}

/** E1 — TOTAL. Every response becomes exactly one failure, and it never
 *  throws: not on a body that is not JSON, not on an empty one, not on one
 *  already consumed. */
export const failureFromResponse: FailureDecoder = async (response) => {
  let problem: Problem = {};
  try {
    const text = await response.text();
    const parsed: unknown = text ? JSON.parse(text) : undefined;
    /* Valid JSON that is not an object — `null`, `7`, `[]` — carries no fields
       to read, so it is treated as no body rather than spread. */
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      problem = parsed as Problem;
    }
  } catch {
    /* not JSON, or already read — fall through to the status */
  }

  const declared = problem.kind;
  const recognised = isFailureKind(declared);

  const meta: FailureMeta = {
    /* E8 */
    message:
      str(problem.message) ??
      str(problem.detail) ??
      str(problem.title) ??
      str(response.statusText) ??
      "The request failed.",
    /* E4/E7 — a body's own `type` wins; an unrecognised kind is PRESERVED here
       rather than discarded, so the union stays closed and the raw value is
       still readable. */
    type: str(problem.type) ?? (recognised ? undefined : str(declared)),
    /* E9 */
    requestId: str(problem.request_id) ?? str(response.headers.get(REQUEST_ID_HEADER)),
    /* E10 — an ECHO. Absent here does not mean the failure has no correlation:
       an adapter attaches what it sent when the server returned none. */
    correlationId: str(problem.correlation_id) ?? str(response.headers.get(CORRELATION_HEADER)),
    /* E2 */
    status: response.status,
  };

  /* E3/E4/E5 — the body classifies when we recognise it; otherwise the status
     does, which is more useful than folding to `internal` and loses nothing,
     because the declared value is already in `type`. */
  return build(recognised ? declared : kindFromStatus(response.status), meta, problem, response);
};

/** E14/E15/E16 — a failure with no response at all: DNS, a dropped socket, an
 *  abort.
 *
 *  Matched by NAME. `instanceof DOMException` is true for every one of these,
 *  so it is not unreliable — it is insufficient: only the name separates a
 *  timeout from a cancellation, and that distinction decides whether the call
 *  is ever retried.
 *
 *  What name arrives is the environment's decision rather than this
 *  function's. The contract is the mapping. */
export function failureFromTransport(cause: unknown): Failure {
  const name = (cause as { name?: unknown } | null | undefined)?.name;
  if (name === "AbortError") return canceled("The request was cancelled.");
  if (name === "TimeoutError") return timeout("The server took too long to respond.");
  return unavailable(
    cause instanceof Error && cause.message ? cause.message : "The server could not be reached.",
  );
}
