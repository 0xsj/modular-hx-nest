import { queryOptions } from "@tanstack/solid-query";
import { unwrap } from "~/lib/kernel";
import type { HttpClient } from "~/lib/http";
import { findDefaultItem, getItem, listItems } from "~/lib/services/example";
import { keys } from "./keys";

/* THE ONE THROW SITE, and it is three lines each.
 *
 * The cache marks a query failed by a rejected promise, so a `Result` has to
 * become an exception exactly here. Every tier below is free of invisible
 * control flow; every tier above recovers the value with `asFailure`.
 *
 * `queryOptions` keeps the key and the function together, so a caller cannot
 * pair the wrong two.
 *
 * The cache hands each query an `AbortSignal` and aborts it when the query is
 * no longer wanted — a component unmounts, a key changes, a refetch supersedes.
 * Threading it into the service is what makes `canceled` reachable at all: the
 * port has always accepted a signal, and without this nothing above the
 * transport could ever supply one. */

export const itemsQuery = (client: HttpClient, workspace: string) =>
  queryOptions({
    queryKey: keys.example.all(workspace),
    queryFn: async ({ signal }) => unwrap(await listItems(client, workspace, { signal })),
  });

export const itemQuery = (client: HttpClient, id: string) =>
  queryOptions({
    queryKey: keys.example.one(id),
    queryFn: async ({ signal }) => unwrap(await getItem(client, id, { signal })),
  });

/** Three states survive the cache: `null` is a legitimate VALUE, so *looked and
 *  found nothing* is a SUCCESS here and never touches the error branch. */
export const defaultItemQuery = (client: HttpClient, workspace: string) =>
  queryOptions({
    queryKey: keys.example.default(workspace),
    queryFn: async ({ signal }) => unwrap(await findDefaultItem(client, workspace, { signal })),
  });
