import {
  canceled,
  isFailureKind,
  timeout,
  unavailable,
  type Failure,
  type FailureKind,
  type FailureMeta,
} from "../kernel";
import { CORRELATION_HEADER, REQUEST_ID_HEADER } from "./port";
import type { FailureDecoder } from "./port";

/* The one file permitted to name a wire key, a header or a status code.
 *
 * It is the DEFAULT decoder, not the only one: `ClientConfig.decodeFailure`
 * replaces it for a backend that speaks differently. Everything above sees
 * only `Failure`. */

/** The problem document this client expects. Flat: `kind` is top-level. Every
 *  field is `unknown` because a wire is not a type. `title`/`detail` are read
 *  as fallbacks so an RFC 9457 body gets a message without a custom decoder. */
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
  /* Both spellings, deliberately. A backend that speaks camelCase is not wrong,
     the two conventions are equally common in problem documents, and this file
     is the anti-corruption layer — being liberal in what it accepts is its job.
     Found by a test writer who had only the contract, which said "taken from
     the body" and did not name a case. Its reading was reasonable. */
  requestId?: unknown;
  correlationId?: unknown;
  retryAfter?: unknown;
};

/** Used ONLY when the body carries no `kind` — a proxy's 502, an HTML error
 *  page. When the body has classified, that wins; a second classification here
 *  would drift. The mapping is to BEHAVIOUR: 422 and 428 are `invalid`, 412 is
 *  `conflict`, which is why there are ten kinds and not thirteen. */
function kindFromStatus(status: number): FailureKind {
  switch (status) {
    case 400:
      return "invalid";
    case 401:
      return "unauthenticated";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 412:
      return "conflict";
    case 422:
      return "invalid";
    case 428:
      return "invalid";
    case 429:
      return "rate_limited";
    case 499:
      return "canceled";
    case 503:
      return "unavailable";
    case 504:
      return "timeout";
    default:
      return "internal";
  }
}

function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v ? v : undefined;
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

/** Assemble the right variant. `fields` is built only for `invalid`,
 *  `retryAfter` only for `rate_limited` — the union makes that a type error to
 *  get wrong rather than a convention. */
function build(
  kind: FailureKind,
  meta: FailureMeta,
  problem: Problem,
  response: Response,
): Failure {
  switch (kind) {
    case "invalid":
      return { kind, ...meta, fields: stringMap(problem.fields) };
    case "rate_limited":
      return {
        kind,
        ...meta,
        retryAfter:
          num(problem.retry_after) ??
          num(problem.retryAfter) ??
          num(response.headers.get("retry-after")),
      };
    default:
      return { kind, ...meta };
  }
}

/** TOTAL: every response becomes exactly one Failure. Never throws, even on a
 *  malformed body. */
export const failureFromResponse: FailureDecoder = async (response) => {
  let problem: Problem = {};
  try {
    const text = await response.text();
    if (text) problem = JSON.parse(text) as Problem;
  } catch {
    /* not JSON, or already read — fall through to the status */
  }

  const declared = problem.kind;
  const known = isFailureKind(declared);

  const meta: FailureMeta = {
    message:
      str(problem.message) ??
      str(problem.detail) ??
      str(problem.title) ??
      str(response.statusText) ??
      "Request failed",
    /* An unrecognised server kind is PRESERVED, not discarded. The union stays
       closed at runtime and the raw value is still there to read. */
    type: str(problem.type) ?? (!known ? str(declared) : undefined),
    requestId:
      str(problem.request_id) ??
      str(problem.requestId) ??
      response.headers.get(REQUEST_ID_HEADER) ??
      undefined,
    /* An ECHO. The client attaches what it sent when the server returns none,
       so this being absent here does not mean the failure has no correlation. */
    correlationId:
      str(problem.correlation_id) ??
      str(problem.correlationId) ??
      response.headers.get(CORRELATION_HEADER) ??
      undefined,
    status: response.status,
  };

  return build(
    known ? declared : kindFromStatus(response.status),
    meta,
    problem,
    response,
  );
};

/** A failure with no response at all: DNS, a dropped socket, an abort.
 *
 *  Matched by NAME, not `instanceof DOMException`. Under jsdom the global
 *  DOMException is jsdom's while fetch throws Node's, and v1's instanceof check
 *  silently classified every abort as `unavailable` — which is retryable. */
export function failureFromTransport(cause: unknown): Failure {
  const name = (cause as { name?: unknown } | null)?.name;
  if (name === "AbortError") return canceled("The request was cancelled.");
  if (name === "TimeoutError")
    return timeout("The server took too long to respond.");
  return unavailable(
    cause instanceof Error ? cause.message : "The server could not be reached.",
  );
}
