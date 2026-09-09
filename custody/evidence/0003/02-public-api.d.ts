import { type Failure, type Fails } from "./failure";
import { type Result } from "./result";
export declare function optional<T, E extends Failure>(result: Promise<Result<T, E>> | Result<T, E>, absent: (failure: Fails<"not_found">) => boolean): Promise<Result<T | null, Exclude<E, Fails<"not_found">> | Fails<"internal">>>;
export declare const anyNotFound: (_failure: Fails<"not_found">) => boolean;
export declare const absentWhenType: (type: string) => (failure: Fails<"not_found">) => boolean;
export type Presence<T, E extends Failure = Failure> = {
    state: "found";
    value: T;
} | {
    state: "empty";
} | {
    state: "unmeasured";
    failure: E;
};
export declare function presenceOf<T, E extends Failure>(result: Result<T | null, E>): Presence<T, E>;
import { type Failure } from "./failure";
import type { Result } from "./result";
export declare class AppError extends Error {
    readonly failure: Failure;
    constructor(failure: Failure);
}
export declare function unwrap<T>(result: Result<T, Failure>): T;
export declare function asFailure(cause: unknown): Failure;
import type { Failure, Result } from "~/lib/kernel";
export type FailureDecoder = (response: Response) => Promise<Failure>;
export type ClientConfig = {
    baseUrl: string;
    timeoutMs?: number;
    getAccessToken?: () => string | null | undefined;
    decodeFailure?: FailureDecoder;
    getCorrelationId?: () => string | null | undefined;
};
export declare const CORRELATION_HEADER = "x-correlation-id";
export declare const REQUEST_ID_HEADER = "x-request-id";
export type RequestOptions = {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
    headers?: Record<string, string>;
};
export type HttpClient = {
    request<T>(method: string, path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
    get<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
    post<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
    put<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
    patch<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
    delete<T>(path: string, options?: RequestOptions): Promise<Result<T, Failure>>;
};
import { type Failure } from "~/lib/kernel";
import { type FailureDecoder } from "./port";
export declare const failureFromResponse: FailureDecoder;
export declare function failureFromTransport(cause: unknown): Failure;
import { type ClientConfig, type HttpClient } from "./port";
export declare function createFetchClient(config: ClientConfig): HttpClient;
import { type Failure, type Result } from "~/lib/kernel";
import type { ClientConfig, HttpClient, RequestOptions } from "./port";
export declare const UNSERVED_ROUTE = "unserved_route";
export type MemoryRequest = {
    method: string;
    path: string;
    params: RequestOptions["params"];
    body: unknown;
    token: string | null;
    correlationId: string | undefined;
};
export type MemoryRoute = {
    method: string;
    pattern: RegExp;
    handle: (request: MemoryRequest, match: RegExpMatchArray) => Result<unknown, Failure> | Promise<Result<unknown, Failure>>;
};
export type MemoryConfig = {
    routes: readonly MemoryRoute[];
    getAccessToken?: ClientConfig["getAccessToken"];
    getCorrelationId?: ClientConfig["getCorrelationId"];
    latencyMs?: number;
};
export declare function createMemoryClient(config: MemoryConfig): HttpClient;
export declare const requireToken: (request: MemoryRequest) => Result<string, Failure>;
