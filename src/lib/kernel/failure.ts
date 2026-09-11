/* v3 — the kinds are split in two, and that split is what fixes v2.
 *
 * v2 let a service narrow the failure union to "what this operation can
 * produce", and its example folded `rate_limited` and `canceled` into
 * `internal`. A rate-limited read then lost the server's retry-after, and a
 * cancellation rendered as an error. The mistake was treating every kind as
 * per-operation. It is not:
 *
 *   TRANSPORT  can happen on ANY call — a 401, a 429, a dropped socket, the
 *              caller's own abort. No service gets to say it cannot produce one.
 *   DOMAIN     varies per operation. A read cannot produce `invalid`; a create
 *              cannot produce `not_found`. This is the only set a service
 *              narrows, and `narrow(...)` below only ever decides these.
 *
 * Everything else from v2 stays: exact-variant constructors, `Fails<K>`, the
 * cause chain, retry as a delay. */

export type FailureMeta = {
  /** The server's words, or ours. DIAGNOSTIC FIRST: it goes in a log and it is
   *  the fallback for `internal`. User-facing copy comes from the exhaustive
   *  switch, in this product's voice. */
  message: string;
  /** A backend-specific condition — "seat_limit_reached". THE extension point:
   *  a product's own vocabulary rides here, never as an eleventh kind. Also
   *  where an unrecognised server kind is preserved. */
  type?: string;
  /** The SERVER's id for the one request that failed. Server-minted; we only
   *  ever read it. */
  requestId?: string;
  /** The interaction this request belonged to. Ours, not the server's — sent as
   *  a header and echoed back, so it is present even when the server ignores
   *  it. A request id identifies one call; this identifies everything one user
   *  action caused, which is what makes a support conversation tractable.
   *
   *  Not to be confused with provenance. This answers *what else happened when
   *  this happened* — operational, transient, for us. Provenance answers *why
   *  do you believe this value* — durable, for the user, and a property of a
   *  domain rather than of a transport. It does not belong here. */
  correlationId?: string;
  /** Carried for diagnostics. NEVER branched on above `lib/http`. */
  status?: number;
  /** What this failure happened WHILE doing. Go's `%w`, Rust's `source()`. */
  cause?: Failure;
};

type MetaInit = Omit<FailureMeta, "message">;

/** Any call can produce one of these. A service passes them through untouched. */
export const TRANSPORT_KINDS = [
  "unauthenticated",
  "forbidden",
  "rate_limited",
  "unavailable",
  "timeout",
  "canceled",
  "internal",
] as const;

/** Whether one of these can occur depends on the operation. A service says
 *  which, and `narrow` folds the rest. */
export const DOMAIN_KINDS = ["not_found", "invalid", "conflict"] as const;

export const FAILURE_KINDS = [...TRANSPORT_KINDS, ...DOMAIN_KINDS] as const;

export type TransportKind = (typeof TRANSPORT_KINDS)[number];
export type DomainKind = (typeof DOMAIN_KINDS)[number];
export type FailureKind = TransportKind | DomainKind;

export type Failure =
  | ({ kind: "unauthenticated" } & FailureMeta)
  | ({ kind: "forbidden" } & FailureMeta)
  | ({ kind: "rate_limited"; retryAfter?: number } & FailureMeta)
  | ({ kind: "unavailable" } & FailureMeta)
  | ({ kind: "timeout" } & FailureMeta)
  /** An answer, not a failure: the caller asked for this. Never folded. */
  | ({ kind: "canceled" } & FailureMeta)
  /** Ours, or nobody's. Also what an unexpected DOMAIN kind folds into, with
   *  the original as its cause. */
  | ({ kind: "internal" } & FailureMeta)
  /** The RESOURCE is not there when it should have been. Not the answer to
   *  "does this exist" — see `optional`. */
  | ({ kind: "not_found" } & FailureMeta)
  | ({ kind: "invalid"; fields: Record<string, string> } & FailureMeta)
  | ({ kind: "conflict" } & FailureMeta);

/** Narrow the union by kind. */
export type Fails<K extends FailureKind> = Extract<Failure, { kind: K }>;

export type TransportFailure = Fails<TransportKind>;
export type DomainFailure = Fails<DomainKind>;

/* Smart constructors — each returns its own variant. */

export const unauthenticated = (
  message: string,
  m: MetaInit = {},
): Fails<"unauthenticated"> => ({
  kind: "unauthenticated",
  message,
  ...m,
});
export const forbidden = (
  message: string,
  m: MetaInit = {},
): Fails<"forbidden"> => ({
  kind: "forbidden",
  message,
  ...m,
});
export const rateLimited = (
  message: string,
  retryAfter?: number,
  m: MetaInit = {},
): Fails<"rate_limited"> => ({
  kind: "rate_limited",
  message,
  ...(retryAfter === undefined ? {} : { retryAfter }),
  ...m,
});
export const unavailable = (
  message: string,
  m: MetaInit = {},
): Fails<"unavailable"> => ({
  kind: "unavailable",
  message,
  ...m,
});
export const timeout = (
  message: string,
  m: MetaInit = {},
): Fails<"timeout"> => ({
  kind: "timeout",
  message,
  ...m,
});
export const canceled = (
  message: string,
  m: MetaInit = {},
): Fails<"canceled"> => ({
  kind: "canceled",
  message,
  ...m,
});
export const internal = (
  message: string,
  m: MetaInit = {},
): Fails<"internal"> => ({
  kind: "internal",
  message,
  ...m,
});
export const notFound = (
  message: string,
  m: MetaInit = {},
): Fails<"not_found"> => ({
  kind: "not_found",
  message,
  ...m,
});
export const invalid = (
  message: string,
  fields: Record<string, string> = {},
  m: MetaInit = {},
): Fails<"invalid"> => ({ kind: "invalid", message, fields, ...m });
export const conflict = (
  message: string,
  m: MetaInit = {},
): Fails<"conflict"> => ({
  kind: "conflict",
  message,
  ...m,
});

/* ── classification ─────────────────────────────────────────────────────── */

export function isFailureKind(v: unknown): v is FailureKind {
  return (
    typeof v === "string" && (FAILURE_KINDS as readonly string[]).includes(v)
  );
}
export function isTransportKind(v: unknown): v is TransportKind {
  return (
    typeof v === "string" && (TRANSPORT_KINDS as readonly string[]).includes(v)
  );
}
export function isDomainKind(v: unknown): v is DomainKind {
  return (
    typeof v === "string" && (DOMAIN_KINDS as readonly string[]).includes(v)
  );
}

/** Structural — a Failure that crossed a serialisation boundary has no
 *  prototype of ours, which is the whole point of it being plain data. */
export function isFailure(v: unknown): v is Failure {
  return (
    typeof v === "object" &&
    v !== null &&
    isFailureKind((v as { kind?: unknown }).kind) &&
    typeof (v as { message?: unknown }).message === "string"
  );
}

/** The type guard a screen uses to hand every transport failure to ONE shared
 *  surface, and switch only over the domain kinds that are left. */
export const isTransport = (f: Failure): f is TransportFailure =>
  isTransportKind(f.kind);

export const isDomain = (failure: Failure): failure is DomainFailure =>
  isDomainKind(failure.kind);

/* ── cause chain ────────────────────────────────────────────────────────── */

/** Attach context on the way up. The outer failure is what the caller renders;
 *  the inner is what the log needs. */
export const because = <F extends Failure>(failure: F, cause: Failure): F => ({
  ...failure,
  cause,
});

/** The chain, outermost first. Terminates on a cycle. */
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

export const rootCause = (failure: Failure): Failure =>
  chain(failure).at(-1) ?? failure;

/* ── narrowing ──────────────────────────────────────────────────────────── */

/** Build the mapper a service uses to say which DOMAIN kinds an operation can
 *  produce. Transport kinds always pass through — that is the split, and it is
 *  why a rate-limited read keeps its retry-after and a cancellation is never
 *  rewritten as an error. A domain kind the operation did not promise is a
 *  contract break: it folds to `internal` WITH the original as cause, so the
 *  signature stays true and nothing is lost.
 *
 *      const asReadFailure = narrow("not_found");
 *      type ReadFailure = TransportFailure | Fails<"not_found">;
 *
 *  Two lines, where v2 needed a fifteen-line switch per tier. */
export function narrow<K extends DomainKind>(
  ...allowed: K[]
): (failure: Failure) => TransportFailure | Fails<K> {
  const ok = new Set<string>(allowed);
  return (f) => {
    if (isTransport(f)) return f;
    if (ok.has(f.kind)) return f as Fails<K>;
    return because(
      internal(f.message, {
        type: f.type,
        requestId: f.requestId,
        correlationId: f.correlationId,
        status: f.status,
      }),
      f,
    );
  };
}

/* ── retry ──────────────────────────────────────────────────────────────── */

/** Three kinds, and `canceled` is deliberately not one of them. A 4xx is an
 *  ANSWER — refusing to retry it is the point. */
export function isRetryable(f: Failure): boolean {
  return (
    f.kind === "rate_limited" ||
    f.kind === "unavailable" ||
    f.kind === "timeout"
  );
}

/** How long to wait before trying again, in ms — or null if it should not be
 *  retried. `rate_limited` carries the server's own answer, and it is honoured
 *  because narrowing can no longer fold it away. */
export const RETRY_BASE_MS = 250;
export const RETRY_CAP_MS = 8_000;

export function retryDelay(f: Failure, attempt: number): number | null {
  if (!isRetryable(f)) return null;
  if (f.kind === "rate_limited" && f.retryAfter !== undefined)
    return f.retryAfter * 1000;
  return Math.min(2 ** Math.max(0, attempt) * RETRY_BASE_MS, RETRY_CAP_MS);
}

/** The sealed-trait guarantee. In a `switch`'s default branch, adding a kind is
 *  a compile error at every call site rather than a silent fallthrough. */
export function assertNever(value: never, context = "value"): never {
  throw new Error(`unhandled ${context}: ${JSON.stringify(value)}`);
}
