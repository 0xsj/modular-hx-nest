import { onMount, onCleanup } from "solid-js";
import { hydrateDensity, hydrateTheme } from "~/lib/runtime";
export function usePreviewPreferences() {
  onMount(() => {
    hydrateTheme();
    hydrateDensity();
    const sync = (event: StorageEvent) => {
      if (event.key === "theme" || event.key === null) hydrateTheme();
      if (event.key === "density" || event.key === null) hydrateDensity();
    };
    window.addEventListener("storage", sync);
    onCleanup(() => window.removeEventListener("storage", sync));
  });
}
