import { QueryClient } from "@tanstack/solid-query";
import { asFailure, retryDelay } from "~/lib/kernel";

/** One client per browser tab, and the defaults are the whole of the policy.
 *
 *  The point of this file: the cache does not invent a retry rule. It asks the
 *  kernel, which answers with a delay or `null` — so a 429's retry-after is
 *  honoured, a refusal is never retried because it is an answer, and a
 *  caller's own cancellation is never retried because they asked for it.
 *
 *  Nothing here names a status code. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (attempt, error) => attempt < 2 && retryDelay(asFailure(error), attempt) !== null,
        retryDelay: (attempt, error) => retryDelay(asFailure(error), attempt) ?? 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      /* A write is never retried automatically: the second attempt may succeed
         against state the first one already changed. */
      mutations: { retry: false },
    },
  });
}
