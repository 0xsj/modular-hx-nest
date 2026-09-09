/* The failure model. The specification is `failure.doc.ts`, which was written
 * before this file existed; clause numbers below cite it. */

export type FailureMeta = {
  /** Diagnostic first — the server's words or ours. User-facing copy comes
   *  from an exhaustive switch, in the product's voice, never from here. */
  message: string;
  /** The extension point. A backend condition, or a server `kind` this union
   *  does not recognise, preserved rather than discarded. */
  type?: string;
  /** The SERVER's id for the one call that failed. Read, never minted. */
  requestId?: string;
  /** The INTERACTION this call belonged to. Ours, not the server's — sent as a
   *  header and echoed back, so it survives a server that ignores it. A
   *  request id names one call; this names everything one user action caused.
   *
   *  Not provenance. This answers *what else happened when this happened* —
   *  operational, transient, ours. Provenance answers *why do you believe this
   *  value* — durable, the user's, and a property of a domain rather than of a
   *  transport. It does not belong on a failure. */
  correlationId?: string;
  /** Carried for diagnostics. Never branched on above `lib/http`. */
  status?: number;
  /** What this failure happened WHILE doing. */
  cause?: Failure;
};

type MetaInit = Omit<FailureMeta, "message">;

/** F8 — a field that was not supplied is ABSENT, not present-and-undefined.
 *  `JSON.stringify` drops undefined-valued keys, so without this a failure
 *  that crossed a wire would not deep-equal the one that did not, and F9's
 *  round-trip would hold only by accident. */
function defined<T extends object>(source: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

/* ── the two sets ─────────────────────────────────────────────────────────
 *
 * `as const` arrays rather than an enum: the array IS the runtime value and
 * the type is derived from it, so the two cannot disagree. An enum gives a
 * type plus a separate object to keep in step, and its numeric form does not
 * survive a wire at all. */

/** No operation author can rule these out, so no service may narrow one away.
 *  They pass through every signature untouched — which is what keeps a rate
 *  limit's retry-after alive and stops a cancellation becoming an error. */
export const TRANSPORT_KINDS = [
  "unauthenticated",
  "forbidden",
  "rate_limited",
  "unavailable",
  "timeout",
  "canceled",
  "internal",
] as const;

/** The author of an operation genuinely knows whether these can occur. The
 *  only set a service may narrow. */
export const DOMAIN_KINDS = ["not_found", "invalid", "conflict"] as const;

/** F1 — the union of the two, in order, with no duplicates. */
export const FAILURE_KINDS = [...TRANSPORT_KINDS, ...DOMAIN_KINDS] as const;

export type TransportKind = (typeof TRANSPORT_KINDS)[number];
export type DomainKind = (typeof DOMAIN_KINDS)[number];
export type FailureKind = TransportKind | DomainKind;

/* ── the union ────────────────────────────────────────────────────────────
 *
 * Per-kind payloads live on their own variants, so "retryAfter belongs to a
 * rate limit and nowhere else" is a type error to get wrong rather than a
 * convention. */

export type Failure =
  | ({ kind: "unauthenticated" } & FailureMeta)
  | ({ kind: "forbidden" } & FailureMeta)
  | ({ kind: "rate_limited"; retryAfter?: number } & FailureMeta)
  | ({ kind: "unavailable" } & FailureMeta)
  | ({ kind: "timeout" } & FailureMeta)
  /** The caller asked for this. An answer, not a problem — and never retried. */
  | ({ kind: "canceled" } & FailureMeta)
  /** Ours, or nobody's. The unknown bucket, and the fold target. */
  | ({ kind: "internal" } & FailureMeta)
  /** The RESOURCE is not there. Not the answer to "does this exist" — and not
   *  what an unserved route should produce; see `failure.doc.ts` §3. */
  | ({ kind: "not_found" } & FailureMeta)
  | ({ kind: "invalid"; fields: Record<string, string> } & FailureMeta)
  | ({ kind: "conflict" } & FailureMeta);

/** Narrow the union by kind. */
export type Fails<K extends FailureKind> = Extract<Failure, { kind: K }>;

export type TransportFailure = Fails<TransportKind>;
export type DomainFailure = Fails<DomainKind>;

/* ── constructors ─────────────────────────────────────────────────────────
 * F4/F5 — each returns its own variant, with `message` passed through. */

export const unauthenticated = (message: string, meta: MetaInit = {}): Fails<"unauthenticated"> =>
  defined({ kind: "unauthenticated", message, ...meta });

export const forbidden = (message: string, meta: MetaInit = {}): Fails<"forbidden"> =>
  defined({ kind: "forbidden", message, ...meta });

/** F7 — the only variant that may carry `retryAfter`. Seconds, as the wire
 *  states it; converting is the decoder's job and it does not exist yet. */
export const rateLimited = (
  message: string,
  retryAfter?: number,
  meta: MetaInit = {},
): Fails<"rate_limited"> => defined({ kind: "rate_limited", message, retryAfter, ...meta });

export const unavailable = (message: string, meta: MetaInit = {}): Fails<"unavailable"> =>
  defined({ kind: "unavailable", message, ...meta });

export const timeout = (message: string, meta: MetaInit = {}): Fails<"timeout"> =>
  defined({ kind: "timeout", message, ...meta });

export const canceled = (message: string, meta: MetaInit = {}): Fails<"canceled"> =>
  defined({ kind: "canceled", message, ...meta });

export const internal = (message: string, meta: MetaInit = {}): Fails<"internal"> =>
  defined({ kind: "internal", message, ...meta });

export const notFound = (message: string, meta: MetaInit = {}): Fails<"not_found"> =>
  defined({ kind: "not_found", message, ...meta });

/** F6 — `fields` is always present, possibly empty. A caller with no per-field
 *  detail passes `{}`; the object being absent would make "no field errors"
 *  and "this server does not send them" the same shape. */
export const invalid = (
  message: string,
  fields: Record<string, string> = {},
  meta: MetaInit = {},
): Fails<"invalid"> => defined({ kind: "invalid", message, fields, ...meta });

export const conflict = (message: string, meta: MetaInit = {}): Fails<"conflict"> =>
  defined({ kind: "conflict", message, ...meta });

/* ── classification ─────────────────────────────────────────────────────── */

/** F3 — false for every string outside the set, and for every non-string.
 *  This is what "closed at runtime" means. */
export function isFailureKind(value: unknown): value is FailureKind {
  return typeof value === "string" && (FAILURE_KINDS as readonly string[]).includes(value);
}

export function isTransportKind(value: unknown): value is TransportKind {
  return typeof value === "string" && (TRANSPORT_KINDS as readonly string[]).includes(value);
}

export function isDomainKind(value: unknown): value is DomainKind {
  return typeof value === "string" && (DOMAIN_KINDS as readonly string[]).includes(value);
}

/** F9 — STRUCTURAL, never `instanceof`. A failure that crossed a serialisation
 *  boundary has no prototype of ours, which is the whole reason this module
 *  has no classes. */
export function isFailure(value: unknown): value is Failure {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as { kind?: unknown; message?: unknown };
  return isFailureKind(candidate.kind) && typeof candidate.message === "string";
}

/** F11 — the guard a screen uses to hand every transport failure to one shared
 *  surface and switch only over the domain kinds that remain. */
export const isTransport = (failure: Failure): failure is TransportFailure =>
  isTransportKind(failure.kind);

export const isDomain = (failure: Failure): failure is DomainFailure =>
  isDomainKind(failure.kind);

/* ── cause chain ────────────────────────────────────────────────────────── */

/** F12 — attach context on the way up without mutating what it wraps. The
 *  outer failure is what a caller renders; the inner is what a log needs. */
export const because = <F extends Failure>(failure: F, cause: Failure): F =>
  ({ ...failure, cause });

/** F13/F14 — outermost first, beginning with the failure itself. Terminates on
 *  a cycle: a hand-built failure that is its own cause must not hang. */
export function chain(failure: Failure): Failure[] {
  const out: Failure[] = [];
  const seen = new Set<Failure>();
  let current: Failure | undefined = failure;
  while (current && !seen.has(current)) {
    seen.add(current);
    out.push(current);
    current = current.cause;
  }
  return out;
}

/** F15 — the last link, or the failure itself when there is no cause. */
export const rootCause = (failure: Failure): Failure => chain(failure).at(-1) ?? failure;

/* ── retry classification ───────────────────────────────────────────────── */

/** F16/F17/F18 — three kinds, and `canceled` is deliberately not one of them:
 *  the caller asked for it, so retrying is doing the thing they cancelled. No
 *  domain kind is retryable either — a refusal is an ANSWER, and asking again
 *  hoping for a different reply turns one wall into three.
 *
 *  Whether to retry is classification. How long to wait is policy, and it
 *  belongs where retries actually happen. */
export function isRetryable(failure: Failure): boolean {
  return (
    failure.kind === "rate_limited" ||
    failure.kind === "unavailable" ||
    failure.kind === "timeout"
  );
}

/* ── folding ────────────────────────────────────────────────────────────── */

/** Replace a failure with `internal` while keeping it underneath and carrying
 *  its metadata forward.
 *
 *  Exported because TWO callers need exactly this and they must not drift:
 *  `narrow` folds a domain kind an operation did not promise, and `optional`
 *  folds a `not_found` a caller did not recognise. The metadata list is the
 *  substance — a fold that dropped it would make a mis-declared read
 *  untraceable at precisely the moment somebody needs to trace it — and having
 *  it written twice is having it written wrong once. */
export function foldToInternal(failure: Failure): Fails<"internal"> {
  return because(
    internal(failure.message, {
      type: failure.type,
      requestId: failure.requestId,
      correlationId: failure.correlationId,
      status: failure.status,
    }),
    failure,
  );
}

/* ── narrowing ──────────────────────────────────────────────────────────── */

/** F20–F25. Build the mapper an operation uses to declare which DOMAIN kinds it
 *  can produce.
 *
 *      const asReadFailure = narrow("not_found");
 *      type ReadFailure = TransportFailure | Fails<"not_found">;
 *
 *  Transport kinds always pass through, which is the split doing its job: a
 *  rate limit keeps its retry-after and a cancellation is never rewritten as an
 *  error, no matter what an operation claimed about itself.
 *
 *  A domain kind the operation did not promise is a contract break rather than
 *  a surprise to swallow. It folds to `internal` so the signature stays true,
 *  and carries the original as `cause` so nothing is lost — including the
 *  metadata a mis-declared service is exactly when you want to trace. */
export function narrow<K extends DomainKind>(
  ...allowed: K[]
): (failure: Failure) => TransportFailure | Fails<K> {
  const promised = new Set<string>(allowed);
  return (failure) => {
    if (isTransport(failure)) return failure;
    if (promised.has(failure.kind)) return failure as Fails<K>;
    return foldToInternal(failure);
  };
}

/** How long to wait before trying again, in milliseconds — or `null` when it
 *  should not be retried at all.
 *
 *  `isRetryable` classifies; this schedules. Both live here so that a cache
 *  asks the error model rather than counting attempts and naming status codes
 *  itself — which is the only way a 429's own retry-after gets honoured.
 *
 *  `retryAfter` is seconds on the wire and milliseconds here; the conversion
 *  happens once, at the only place that consumes it. */
export function retryDelay(failure: Failure, attempt: number): number | null {
  if (!isRetryable(failure)) return null;
  if (failure.kind === "rate_limited" && failure.retryAfter !== undefined) {
    return failure.retryAfter * 1000;
  }
  return Math.min(2 ** attempt * 250, 8_000);
}

/* ── exhaustiveness ─────────────────────────────────────────────────────── */

/** F19 — in a `switch` default, adding a kind becomes a compile error at every
 *  call site rather than a silent fallthrough. The throw is the backstop for a
 *  value that arrived untyped. */
export function assertNever(value: never, context = "value"): never {
  throw new Error(`unhandled ${context}: ${JSON.stringify(value)}`);
}
