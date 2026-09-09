import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import { isServer } from "solid-js/web";
import { density, hydrateDensity, type Density } from "./density";
import { interaction } from "./interaction";
import type { Store } from "./store";
import { hydrateTheme, resolvedTheme, theme, type Theme } from "./theme";

/* The ONLY file in this tier that imports the framework.
 *
 * Everything else here is a plain store, so the state machines and the
 * persistence are identical across the sibling templates and only this file
 * differs. The binding is the cheap half; the machine is the part worth
 * sharing.
 *
 * `isServer` stands in for a server snapshot: the server has no storage and no
 * document, so it must render the store's INITIAL value on every request. Read
 * the live value there and two requests can disagree — and one caller's
 * preference is served to the next. */

function fromStore<T>(store: Store<T>): Accessor<T> {
  const [value, setValue] = createSignal<T>(isServer ? store.server() : store.get());
  onMount(() => {
    /* Re-read on mount: the store may have moved between first paint and
       hydration — `hydrateTheme` is exactly that case. */
    setValue(() => store.get());
    onCleanup(store.subscribe(() => setValue(() => store.get())));
  });
  return value;
}

/** Read the stored preferences once, after mount.
 *
 *  Never during render: the server has no storage, so a value read there is a
 *  hydration mismatch — the class of bug that shows as a flash of the wrong
 *  theme and then corrects itself. */
export function hydrateRuntime(): void {
  onMount(() => {
    hydrateTheme();
    hydrateDensity();
  });
}

export function useTheme(): {
  choice: Accessor<Theme>;
  resolved: Accessor<"light" | "dark">;
  set: (next: Theme) => void;
} {
  const choice = fromStore(theme);
  return { choice, resolved: () => resolvedTheme(choice()), set: theme.set };
}

export function useDensity(): { value: Accessor<Density>; set: (next: Density) => void } {
  return { value: fromStore(density), set: density.set };
}

/** The id, for a surface that wants to show it. Starting one is a handler's
 *  job, not a binding's — a render is not a user action. */
export function useInteraction(): Accessor<string> {
  return fromStore(interaction);
}
