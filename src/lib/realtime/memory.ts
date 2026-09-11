import type { Failure } from "../kernel";
import type { ConnectionState, EventObserver, EventSource } from "./port";

export function createMemorySource<T>(): EventSource<T> & {
  publish(value: T): void;
  disconnect(): void;
  reconnect(): void;
  reject(failure: Failure): void;
} {
  const observers = new Set<EventObserver<T>>();
  let connection: ConnectionState = { state: "open", reconnected: false };
  function state(next: ConnectionState) {
    connection = next;
    for (const observer of observers) observer.state(next);
  }
  return {
    subscribe(observer) {
      observers.add(observer);
      observer.state(connection);
      return () => {
        observers.delete(observer);
      };
    },
    publish(value) {
      if (connection.state === "open")
        for (const observer of observers) observer.event(value);
    },
    disconnect: () => state({ state: "closed" }),
    reconnect: () => state({ state: "open", reconnected: true }),
    reject(failure) {
      for (const observer of observers) observer.error(failure);
    },
  };
}
