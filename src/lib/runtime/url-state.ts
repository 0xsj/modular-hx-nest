import {
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  onMount,
} from "solid-js";
import { useLocation } from "@solidjs/router";
import { err, internal, ok, type Result } from "../kernel";
import type { QuerySchema } from "../url-state";
export type HistoryMode = "push" | "replace";
export function writeQueryState<T>(
  schema: QuerySchema<T>,
  change: (current: T) => T,
  mode: HistoryMode = "push",
): Result<void> {
  try {
    const current = window.location;
    const result = schema.update(current.search, change);
    if (!result.ok) return err(result.error);
    const query = result.value.toString(),
      href = `${current.pathname}${query ? `?${query}` : ""}${current.hash}`;
    if (href !== `${current.pathname}${current.search}${current.hash}`)
      window.history[mode === "replace" ? "replaceState" : "pushState"](
        window.history.state,
        "",
        href,
      );
    window.dispatchEvent(new Event("flover:url-state"));
    return ok(undefined);
  } catch {
    return err(
      internal("The browser could not update this view’s address. Try again.", {
        type: "url_state_unavailable",
      }),
    );
  }
}
/** Browser history edits retain mounted models and merge at event time. Router
 * navigation and Back/Forward also update this binding. */
export function useUrlState<T>(schema: QuerySchema<T>) {
  const location = useLocation();
  const [address, setAddress] = createSignal(
    `${location.pathname}${location.search}${location.hash}`,
  );
  const read = () =>
    setAddress(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  createEffect(() =>
    setAddress(`${location.pathname}${location.search}${location.hash}`),
  );
  onMount(() => {
    for (const name of ["popstate", "hashchange", "flover:url-state"])
      window.addEventListener(name, read);
    onCleanup(() => {
      for (const name of ["popstate", "hashchange", "flover:url-state"])
        window.removeEventListener(name, read);
    });
  });
  const url = createMemo(() => new URL(address(), "http://flover.local"));
  const parsed = createMemo(() => schema.read(url().search));
  return {
    get value() {
      return parsed().value;
    },
    get issues() {
      return parsed().issues;
    },
    get path() {
      return `${url().pathname}${url().search}`;
    },
    update: (change: (current: T) => T, mode?: HistoryMode) =>
      writeQueryState(schema, change, mode),
  };
}
