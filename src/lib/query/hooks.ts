import { clientData } from "./browser";
import { createSignal, onMount } from "solid-js";

/** Defer browser reads until hydration has adopted the server markup. */
function browserReady() {
  const [ready, setReady] = createSignal(false);
  onMount(() => setReady(true));
  return ready;
}
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/solid-query";
import { asFailure, unwrap } from "../kernel";
import type { HttpClient } from "../http";
import { revokeSession, type SessionSummary } from "../services/session";
import { keys } from "./keys";
import { activityQuery, sessionsQuery } from "./queries";

/* The only file above this tier that names the cache library, so a screen
 * imports a hook and never a client — the same arrangement `lib/runtime` uses
 * one tier down, and the reason the set of query call sites stays countable.
 *
 * These are the lines that differ per sibling. Everything else in this tier —
 * the keys, the retry policy asking the kernel, the single throw site — is the
 * shape that ports. */

export function useSessions(client: HttpClient) {
  const ready = browserReady();
  return clientData(
    createQuery(() => ({ ...sessionsQuery(client), enabled: ready() })),
    ready,
  );
}

/** The audit log, a page at a time.
 *
 *  The facet and the correlation are part of the KEY, so two filters are two
 *  cache entries. Sharing one would show the previous filter's rows until the
 *  refetch landed, which reads as a slow server rather than as a key that was
 *  too coarse. */
export function useActivity(
  client: HttpClient,
  filter: () => { facet?: string; correlation?: string } = () => ({}),
) {
  const ready = browserReady();
  return clientData(
    createInfiniteQuery(() => ({
      ...activityQuery(client, filter()),
      enabled: ready(),
    })),
    ready,
  );
}

/** A write, optimistic, over the port.
 *
 *  This is a resource write from an already-interactive screen,
 *  where the answer is instant and the rollback is cheap.
 *
 *  # The four callbacks are one idea
 *
 *      onMutate    remove the row NOW, and keep what it was
 *      onError     put it back — unless the failure says it was already gone
 *      onSettled   invalidate, so the server has the last word either way
 *
 *  # `cancelQueries` first, and it is not optional
 *
 *  A refetch already in flight resolves with a list that still contains the row
 *  this is removing, and it lands AFTER the optimistic update — so the row
 *  reappears for one frame and then vanishes again. Cancelling is what makes
 *  the optimistic update hold, and it is the reason the port has always
 *  accepted a signal.
 *
 *  # A rollback that is wrong is worse than none
 *
 *  `not_found` means the session had already ended, so the removal was RIGHT.
 *  Rolling that one back puts a dead row back on screen and tells the reader
 *  their action failed when it had already happened. The kind decides. */
export function useRevokeSession(client: HttpClient) {
  const cache = useQueryClient();
  const key = keys.session.all();

  return createMutation(() => ({
    mutationFn: async (id: string) => unwrap(await revokeSession(client, id)),

    onMutate: async (id) => {
      await cache.cancelQueries({ queryKey: key });
      const previous = cache.getQueryData<SessionSummary[]>(key);
      cache.setQueryData<SessionSummary[]>(key, (rows) =>
        rows?.filter((row) => row.id !== id),
      );
      return { previous };
    },

    onError: (error, _id, context) => {
      if (asFailure(error).kind === "not_found") return;
      if (context?.previous) cache.setQueryData(key, context.previous);
    },

    onSettled: () => cache.invalidateQueries({ queryKey: keys.session.root() }),
  }));
}
