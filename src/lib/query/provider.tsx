import { QueryClientProvider } from "@tanstack/solid-query";
import type { JSX } from "solid-js";
import { onCleanup } from "solid-js";
import { makeQueryClient } from "./client";
/** One cache per provider owner, including each server request. */
export function QueryProvider(props: { children: JSX.Element }) {
  const client = makeQueryClient();
  onCleanup(() => client.clear());
  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}
