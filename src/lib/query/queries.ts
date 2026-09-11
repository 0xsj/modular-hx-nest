import { infiniteQueryOptions, queryOptions } from "@tanstack/solid-query";
import { unwrap } from "../kernel";
import type { HttpClient } from "../http";
import { findDefaultItem, getItem, listItems } from "../services/example";
import { getMyActivity } from "../services/ledger";
import { listSessions } from "../services/session";
import { keys } from "./keys";

/* THE ONE THROW SITE, and it is three lines each.
 *
 * The cache marks a query failed by a rejected promise, so a Result has to
 * become an exception exactly here. Every tier below is free of invisible
 * control flow; every tier above recovers the value with `asFailure`.
 *
 * `queryOptions` keeps the key and the function together, so a caller cannot
 * pair the wrong two.
 *
 * The cache hands each query an AbortSignal and aborts it when the query is no
 * longer wanted — a component unmounts, a key changes, a refetch supersedes.
 * Threading it into the service is what makes `canceled` reachable at all: the
 * port has always accepted a signal, and without this nothing above the
 * transport could ever supply one. */

/** The one query with a real caller.
 *
 *  Its client is a fetch adapter pointed at this application's own origin, not
 *  at an API — the session cookie is HttpOnly, so the browser cannot hold a
 *  bearer and asks its own server instead. The route handler answers in the
 *  same problem document the adapter decodes, so what arrives here is the same
 *  `Failure` the server had, and the retry policy below reasons about it
 *  without knowing which side produced it. */
export const sessionsQuery = (client: HttpClient) =>
  queryOptions({
    queryKey: keys.session.all(),
    queryFn: async ({ signal }) =>
      unwrap(await listSessions(client, { signal })),
  });

/** A cursor-paged read, which is the shape this cache is actually for.
 *
 *  # `getNextPageParam` reads the ABSENCE of a cursor
 *
 *  The server omits `next` when there is no more, so "is there another page" is
 *  a property of the response rather than a count a caller maintains — and
 *  `hasNextPage` follows from it. Returning `undefined` is what stops the
 *  infinite query, and a server that sent `next: null` instead would need the
 *  coalesce that is here anyway.
 *
 *  # Offset pagination would be wrong, not merely worse
 *
 *  The ledger grows at the head, so a page-2 offset request made a second later
 *  re-shows rows that moved down and hides the ones that took their place. The
 *  cursor is opaque on purpose; a screen that parses it breaks the day the
 *  server stops using an index. */
export const activityQuery = (
  client: HttpClient,
  filter: { facet?: string; correlation?: string } = {},
) =>
  infiniteQueryOptions({
    queryKey: keys.activity.list(filter.facet, filter.correlation),
    queryFn: async ({ pageParam, signal }) =>
      unwrap(
        await getMyActivity(client, { ...filter, after: pageParam, signal }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
  });

export const itemsQuery = (client: HttpClient, workspace: string) =>
  queryOptions({
    queryKey: keys.example.all(workspace),
    queryFn: async ({ signal }) =>
      unwrap(await listItems(client, workspace, { signal })),
  });

export const itemQuery = (client: HttpClient, id: string) =>
  queryOptions({
    queryKey: keys.example.one(id),
    queryFn: async ({ signal }) =>
      unwrap(await getItem(client, id, { signal })),
  });

/** Three states survive the cache: `null` is a legitimate VALUE, so "looked and
 *  found nothing" is a SUCCESS here and never touches the error branch. */
export const defaultItemQuery = (client: HttpClient, workspace: string) =>
  queryOptions({
    queryKey: keys.example.default(workspace),
    queryFn: async ({ signal }) =>
      unwrap(await findDefaultItem(client, workspace, { signal })),
  });
