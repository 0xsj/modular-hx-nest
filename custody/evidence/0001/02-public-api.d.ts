export type FailureMeta = {
    /** Diagnostic first — the server's words or ours. User-facing copy comes
     *  from an exhaustive switch, in the product's voice, never from here. */
    message: string;
    /** The extension point. A backend condition, or a server `kind` this union
     *  does not recognise, preserved rather than discarded. */
    type?: string;
    /** The SERVER's id for the one call that failed. Read, never minted. */
    requestId?: string;
    /** Carried for diagnostics. Never branched on above `lib/http`. */
    status?: number;
    /** What this failure happened WHILE doing. */
    cause?: Failure;
};
type MetaInit = Omit<FailureMeta, "message">;
/** No operation author can rule these out, so no service may narrow one away.
 *  They pass through every signature untouched — which is what keeps a rate
 *  limit's retry-after alive and stops a cancellation becoming an error. */
export declare const TRANSPORT_KINDS: readonly ["unauthenticated", "forbidden", "rate_limited", "unavailable", "timeout", "canceled", "internal"];
/** The author of an operation genuinely knows whether these can occur. The
 *  only set a service may narrow. */
export declare const DOMAIN_KINDS: readonly ["not_found", "invalid", "conflict"];
/** F1 — the union of the two, in order, with no duplicates. */
export declare const FAILURE_KINDS: readonly ["unauthenticated", "forbidden", "rate_limited", "unavailable", "timeout", "canceled", "internal", "not_found", "invalid", "conflict"];
export type TransportKind = (typeof TRANSPORT_KINDS)[number];
export type DomainKind = (typeof DOMAIN_KINDS)[number];
export type FailureKind = TransportKind | DomainKind;
export type Failure = ({
    kind: "unauthenticated";
} & FailureMeta) | ({
    kind: "forbidden";
} & FailureMeta) | ({
    kind: "rate_limited";
    retryAfter?: number;
} & FailureMeta) | ({
    kind: "unavailable";
} & FailureMeta) | ({
    kind: "timeout";
} & FailureMeta)
/** The caller asked for this. An answer, not a problem — and never retried. */
 | ({
    kind: "canceled";
} & FailureMeta)
/** Ours, or nobody's. The unknown bucket, and the fold target. */
 | ({
    kind: "internal";
} & FailureMeta)
/** The RESOURCE is not there. Not the answer to "does this exist" — and not
 *  what an unserved route should produce; see `failure.doc.ts` §3. */
 | ({
    kind: "not_found";
} & FailureMeta) | ({
    kind: "invalid";
    fields: Record<string, string>;
} & FailureMeta) | ({
    kind: "conflict";
} & FailureMeta);
/** Narrow the union by kind. */
export type Fails<K extends FailureKind> = Extract<Failure, {
    kind: K;
}>;
export type TransportFailure = Fails<TransportKind>;
export type DomainFailure = Fails<DomainKind>;
export declare const unauthenticated: (message: string, meta?: MetaInit) => Fails<"unauthenticated">;
export declare const forbidden: (message: string, meta?: MetaInit) => Fails<"forbidden">;
/** F7 — the only variant that may carry `retryAfter`. Seconds, as the wire
 *  states it; converting is the decoder's job and it does not exist yet. */
export declare const rateLimited: (message: string, retryAfter?: number, meta?: MetaInit) => Fails<"rate_limited">;
export declare const unavailable: (message: string, meta?: MetaInit) => Fails<"unavailable">;
export declare const timeout: (message: string, meta?: MetaInit) => Fails<"timeout">;
export declare const canceled: (message: string, meta?: MetaInit) => Fails<"canceled">;
export declare const internal: (message: string, meta?: MetaInit) => Fails<"internal">;
export declare const notFound: (message: string, meta?: MetaInit) => Fails<"not_found">;
/** F6 — `fields` is always present, possibly empty. A caller with no per-field
 *  detail passes `{}`; the object being absent would make "no field errors"
 *  and "this server does not send them" the same shape. */
export declare const invalid: (message: string, fields?: Record<string, string>, meta?: MetaInit) => Fails<"invalid">;
export declare const conflict: (message: string, meta?: MetaInit) => Fails<"conflict">;
/** F3 — false for every string outside the set, and for every non-string.
 *  This is what "closed at runtime" means. */
export declare function isFailureKind(value: unknown): value is FailureKind;
export declare function isTransportKind(value: unknown): value is TransportKind;
export declare function isDomainKind(value: unknown): value is DomainKind;
/** F9 — STRUCTURAL, never `instanceof`. A failure that crossed a serialisation
 *  boundary has no prototype of ours, which is the whole reason this module
 *  has no classes. */
export declare function isFailure(value: unknown): value is Failure;
/** F11 — the guard a screen uses to hand every transport failure to one shared
 *  surface and switch only over the domain kinds that remain. */
export declare const isTransport: (failure: Failure) => failure is TransportFailure;
export declare const isDomain: (failure: Failure) => failure is DomainFailure;
/** F12 — attach context on the way up without mutating what it wraps. The
 *  outer failure is what a caller renders; the inner is what a log needs. */
export declare const because: <F extends Failure>(failure: F, cause: Failure) => F;
/** F13/F14 — outermost first, beginning with the failure itself. Terminates on
 *  a cycle: a hand-built failure that is its own cause must not hang. */
export declare function chain(failure: Failure): Failure[];
/** F15 — the last link, or the failure itself when there is no cause. */
export declare const rootCause: (failure: Failure) => Failure;
/** F16/F17/F18 — three kinds, and `canceled` is deliberately not one of them:
 *  the caller asked for it, so retrying is doing the thing they cancelled. No
 *  domain kind is retryable either — a refusal is an ANSWER, and asking again
 *  hoping for a different reply turns one wall into three.
 *
 *  Whether to retry is classification. How long to wait is policy, and it
 *  belongs where retries actually happen. */
export declare function isRetryable(failure: Failure): boolean;
/** F19 — in a `switch` default, adding a kind becomes a compile error at every
 *  call site rather than a silent fallthrough. The throw is the backstop for a
 *  value that arrived untyped. */
export declare function assertNever(value: never, context?: string): never;
export {};
