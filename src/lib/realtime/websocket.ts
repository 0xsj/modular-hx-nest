import { invalid, unavailable, type Result } from "../kernel";
import type { EventSource } from "./port";

export type SocketOptions<T> = {
  /** Resolve on every connection, so an adapter can renew its connection URL. */
  url: () => string;
  decode: (message: unknown) => Result<T>;
  socket?: (
    url: string,
  ) => Pick<WebSocket, "addEventListener" | "removeEventListener" | "close">;
  retry?: { attempts: number; baseMs: number; maxMs: number };
};

export function createWebSocketSource<T>({
  url,
  decode,
  socket = (url) => new WebSocket(url),
  retry = { attempts: 8, baseMs: 250, maxMs: 8_000 },
}: SocketOptions<T>): EventSource<T> {
  return {
    subscribe(observer) {
      let disposed = false;
      let opened = false;
      let attempt = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let release: (() => void) | undefined;
      const dropped = () =>
        unavailable("Live updates are disconnected.", {
          type: "socket_disconnected",
        });
      function reconnect() {
        if (disposed) return;
        if (attempt >= retry.attempts) {
          observer.state({ state: "closed", failure: dropped() });
          return;
        }
        const retryInMs = Math.max(
          0,
          Math.min(retry.baseMs * 2 ** attempt, retry.maxMs),
        );
        attempt += 1;
        observer.state({
          state: "reconnecting",
          attempt,
          retryInMs,
          failure: dropped(),
        });
        timer = setTimeout(connect, retryInMs);
      }
      function connect() {
        if (disposed) return;
        let connection: ReturnType<NonNullable<SocketOptions<T>["socket"]>>;
        try {
          connection = socket(url());
        } catch {
          reconnect();
          return;
        }
        const onOpen = () => {
          if (disposed) return;
          attempt = 0;
          observer.state({ state: "open", reconnected: opened });
          opened = true;
        };
        const onMessage = (event: MessageEvent) => {
          if (disposed) return;
          let result: Result<T>;
          try {
            result = decode(
              typeof event.data === "string"
                ? JSON.parse(event.data)
                : event.data,
            );
          } catch {
            observer.error(
              invalid(
                "A live update could not be decoded.",
                {},
                { type: "socket_message" },
              ),
            );
            return;
          }
          if (result.ok) observer.event(result.value);
          else observer.error(result.error);
        };
        const onClose = (event: CloseEvent) => {
          detach();
          release = undefined;
          if (disposed) return;
          // A policy/auth close is an answer. Repeatedly reconnecting cannot
          // make it permission; the owner must create a new subscription.
          if (
            event.code === 1000 ||
            event.code === 1008 ||
            event.code >= 4000
          ) {
            observer.state({
              state: "closed",
              ...(event.code === 1000 ? {} : { failure: dropped() }),
            });
          } else reconnect();
        };
        const onError = () => {
          if (!disposed) observer.error(dropped());
        };
        function detach() {
          connection.removeEventListener("open", onOpen);
          connection.removeEventListener("message", onMessage);
          connection.removeEventListener("close", onClose);
          connection.removeEventListener("error", onError);
        }
        connection.addEventListener("open", onOpen);
        connection.addEventListener("message", onMessage);
        connection.addEventListener("close", onClose);
        connection.addEventListener("error", onError);
        release = () => {
          detach();
          connection.close();
        };
      }
      observer.state({ state: "connecting" });
      connect();
      return () => {
        disposed = true;
        clearTimeout(timer);
        release?.();
      };
    },
  };
}
