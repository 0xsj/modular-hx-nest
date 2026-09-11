import { clientData } from "./browser";
import { createSignal, onMount } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { unwrap, type Result } from "../kernel";
import type { CacheKey } from "./live";
export function useResourceQuery<T>(options: {
  key: CacheKey;
  read: (signal: AbortSignal) => Promise<Result<T>>;
}) {
  const [ready, setReady] = createSignal(false);
  onMount(() => setReady(true));
  return clientData(
    createQuery(() => ({
      deferStream: true,
      enabled: ready(),
      queryKey: options.key,
      queryFn: async ({ signal }) => unwrap(await options.read(signal)),
    })),
    ready,
  );
}
export { createQuery } from "@tanstack/solid-query";
