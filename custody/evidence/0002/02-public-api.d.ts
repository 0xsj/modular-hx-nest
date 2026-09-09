export type FailureMeta = {
    message: string;
    type?: string;
    requestId?: string;
    correlationId?: string;
    status?: number;
    cause?: Failure;
};
type MetaInit = Omit<FailureMeta, "message">;
export declare const TRANSPORT_KINDS: readonly ["unauthenticated", "forbidden", "rate_limited", "unavailable", "timeout", "canceled", "internal"];
export declare const DOMAIN_KINDS: readonly ["not_found", "invalid", "conflict"];
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
} & FailureMeta) | ({
    kind: "canceled";
} & FailureMeta) | ({
    kind: "internal";
} & FailureMeta) | ({
    kind: "not_found";
} & FailureMeta) | ({
    kind: "invalid";
    fields: Record<string, string>;
} & FailureMeta) | ({
    kind: "conflict";
} & FailureMeta);
export type Fails<K extends FailureKind> = Extract<Failure, {
    kind: K;
}>;
export type TransportFailure = Fails<TransportKind>;
export type DomainFailure = Fails<DomainKind>;
export declare const unauthenticated: (message: string, meta?: MetaInit) => Fails<"unauthenticated">;
export declare const forbidden: (message: string, meta?: MetaInit) => Fails<"forbidden">;
export declare const rateLimited: (message: string, retryAfter?: number, meta?: MetaInit) => Fails<"rate_limited">;
export declare const unavailable: (message: string, meta?: MetaInit) => Fails<"unavailable">;
export declare const timeout: (message: string, meta?: MetaInit) => Fails<"timeout">;
export declare const canceled: (message: string, meta?: MetaInit) => Fails<"canceled">;
export declare const internal: (message: string, meta?: MetaInit) => Fails<"internal">;
export declare const notFound: (message: string, meta?: MetaInit) => Fails<"not_found">;
export declare const invalid: (message: string, fields?: Record<string, string>, meta?: MetaInit) => Fails<"invalid">;
export declare const conflict: (message: string, meta?: MetaInit) => Fails<"conflict">;
export declare function isFailureKind(value: unknown): value is FailureKind;
export declare function isTransportKind(value: unknown): value is TransportKind;
export declare function isDomainKind(value: unknown): value is DomainKind;
export declare function isFailure(value: unknown): value is Failure;
export declare const isTransport: (failure: Failure) => failure is TransportFailure;
export declare const isDomain: (failure: Failure) => failure is DomainFailure;
export declare const because: <F extends Failure>(failure: F, cause: Failure) => F;
export declare function chain(failure: Failure): Failure[];
export declare const rootCause: (failure: Failure) => Failure;
export declare function isRetryable(failure: Failure): boolean;
export declare function narrow<K extends DomainKind>(...allowed: K[]): (failure: Failure) => TransportFailure | Fails<K>;
export declare function assertNever(value: never, context?: string): never;
export {};
import type { Failure } from "./failure";
export declare class Ok<T, E = Failure> {
    readonly value: T;
    readonly ok: true;
    constructor(value: T);
    map<U>(f: (value: T) => U): Result<U, E>;
    mapErr<F>(_f: (error: E) => F): Result<T, F>;
    andThen<U, F = E>(f: (value: T) => Result<U, F>): Result<U, E | F>;
    match<U>(on: {
        ok: (value: T) => U;
        err: (error: E) => U;
    }): U;
    unwrapOr(_fallback: T): T;
    toJSON(): {
        ok: true;
        value: T;
    };
}
export declare class Err<T, E = Failure> {
    readonly error: E;
    readonly ok: false;
    constructor(error: E);
    map<U>(_f: (value: T) => U): Result<U, E>;
    mapErr<F>(f: (error: E) => F): Result<T, F>;
    andThen<U, F = E>(_f: (value: T) => Result<U, F>): Result<U, E | F>;
    match<U>(on: {
        ok: (value: T) => U;
        err: (error: E) => U;
    }): U;
    unwrapOr(fallback: T): T;
    toJSON(): {
        ok: false;
        error: E;
    };
}
export type Result<T, E = Failure> = Ok<T, E> | Err<T, E>;
export declare const ok: <T, E = Failure>(value: T) => Ok<T, E>;
export declare const err: <T = never, E = Failure>(error: E) => Err<T, E>;
export declare function fromJSON<T, E>(value: {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
}): Result<T, E>;
