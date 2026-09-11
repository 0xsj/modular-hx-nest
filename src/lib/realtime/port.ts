import type { Failure } from "../kernel";

export type ConnectionState =
  | { state: "connecting" }
  | { state: "open"; reconnected: boolean }
  | {
      state: "reconnecting";
      attempt: number;
      retryInMs: number;
      failure: Failure;
    }
  | { state: "closed"; failure?: Failure };
export interface EventObserver<T> {
  event(value: T): void;
  state(value: ConnectionState): void;
  error(failure: Failure): void;
}
export interface EventSource<T> {
  subscribe(observer: EventObserver<T>): () => void;
}
