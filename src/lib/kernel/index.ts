export { cn } from "./cn";
export type { ClassValue } from "./cn";

export { Err, Ok, all, err, fromJSON, ok } from "./result";
export { AppError, asFailure, unwrap } from "./app-error";
export { absentWhenType, anyNotFound, optional, presenceOf } from "./optional";
export type { Presence } from "./optional";
export type { Result } from "./result";

export {
  DOMAIN_KINDS,
  FAILURE_KINDS,
  TRANSPORT_KINDS,
  assertNever,
  because,
  canceled,
  chain,
  conflict,
  forbidden,
  internal,
  invalid,
  isDomain,
  isDomainKind,
  isFailure,
  isFailureKind,
  isRetryable,
  isTransport,
  foldToInternal,
  isTransportKind,
  narrow,
  notFound,
  retryDelay,
  rateLimited,
  rootCause,
  timeout,
  unauthenticated,
  unavailable,
} from "./failure";
export type {
  DomainFailure,
  DomainKind,
  Failure,
  FailureKind,
  FailureMeta,
  Fails,
  TransportFailure,
  TransportKind,
} from "./failure";
