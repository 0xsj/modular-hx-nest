import { QueryClientProvider } from "@tanstack/solid-query";
import { createSignal, type JSX } from "solid-js";
import { makeQueryClient } from "./client";

/** The client, made ONCE per mount and held in a signal.
 *
 *  Not a module-level singleton: on the server that would be one cache shared
 *  by every request — one caller's data served to the next. A signal created
 *  inside the component gives each render its own and survives re-render
 *  without rebuilding it. */
export function QueryProvider(props: { children: JSX.Element }): JSX.Element {
  const [client] = createSignal(makeQueryClient());
  return <QueryClientProvider client={client()}>{props.children}</QueryClientProvider>;
}
