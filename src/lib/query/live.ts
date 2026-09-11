import { createSignal, createEffect, onCleanup } from "solid-js";
import { useQueryClient } from "@tanstack/solid-query";
import type { Failure } from "../kernel";
import type { ConnectionState, EventSource } from "../realtime";

export type CacheKey = readonly unknown[];
export type LiveQueryOptions<T> = {
  source: EventSource<T>;
  /** Return prefixes from the shared keys registry; [] means irrelevant. */
  affected: (event: T) => readonly CacheKey[];
  /** Resync on open, including the first connection, to cover subscription gaps. */
  resync: readonly CacheKey[];
  batchMs?: number;
};

export function useLiveQueries<T>({
  source,
  affected,
  resync,
  batchMs = 80,
}: LiveQueryOptions<T>) {
  const cache = useQueryClient();
  const [connection, setConnection] = createSignal<ConnectionState>({
    state: "connecting",
  });
  const [failure, setFailure] = createSignal<Failure | null>(null);
  createEffect(() => {
    let pending = new Map<string, CacheKey>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule(keys: readonly CacheKey[]) {
      for (const key of keys) pending.set(JSON.stringify(key), key);
      if (timer !== undefined || pending.size === 0) return;
      timer = setTimeout(() => {
        const keys = [...pending.values()];
        pending = new Map();
        timer = undefined;
        for (const queryKey of keys) void cache.invalidateQueries({ queryKey });
      }, batchMs);
    }
    const unsubscribe = source.subscribe({
      event: (event) => schedule(affected(event)),
      state(value) {
        setConnection(value);
        if (value.state === "open") {
          setFailure(null);
          schedule(resync);
        }
      },
      error: setFailure,
    });
    onCleanup(() => {
      unsubscribe();
      clearTimeout(timer);
      pending.clear();
    });
  });
  return {
    get connection() {
      return connection();
    },
    get failure() {
      return failure();
    },
  };
}

/** Mount when only synchronization is needed; use the hook to display status. */
export function LiveQueryBridge<T>(props: LiveQueryOptions<T>) {
  useLiveQueries(props);
  return null;
}
