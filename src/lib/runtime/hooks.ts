import { onMount, onCleanup } from "solid-js";
import type { StoredDocument } from "../storage";
import { createDocumentStore } from "./document-store";
import { observeStore } from "./observe";
import { density, hydrateDensity } from "./density";
import { theme, hydrateTheme, resolvedTheme } from "./theme";
import { interaction } from "./interaction";
export function useHydrateRuntime() {
  onMount(() => {
    hydrateTheme();
    hydrateDensity();
  });
}
export function useTheme() {
  const choice = observeStore(theme.subscribe, theme.get, theme.server);
  return { choice, resolved: () => resolvedTheme(choice()), set: theme.set };
}
export function useDensity() {
  return {
    value: observeStore(density.subscribe, density.get, density.server),
    set: density.set,
  };
}
export function useInteraction() {
  return observeStore(
    interaction.subscribe,
    interaction.get,
    interaction.server,
  );
}
export function useStoredDocument<T>(document: StoredDocument<T>) {
  const store = createDocumentStore(document);
  onMount(() => onCleanup(store.connect()));
  return observeStore(store.subscribe, store.get, store.server);
}
