import { createStore, persisted } from "./store";

/* Three states, not two.
 *
 * "Follow the system" is a real choice and not the absence of one — a user who
 * has chosen it wants the page to change when their OS does, and a user who
 * chose `light` wants it not to. Collapsing them to a boolean loses the
 * difference and there is no way to recover it afterwards.
 *
 * `system` is expressed by REMOVING the attribute, so the media query in the
 * token layer takes over. That is why the semantic tokens are stated twice:
 * once under `prefers-color-scheme`, once under an explicit attribute. */
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const stored = persisted<Theme>("theme", "system", THEMES);

export const theme = createStore<Theme>("system", (value) => {
  stored.write(value);
  applyTheme(value);
});

export function applyTheme(value: Theme): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  if (value === "system") delete root.dataset.theme;
  else root.dataset.theme = value;
}

/** Called once by the shell, after mount. Reading storage during render would
 *  produce a server/client mismatch; the server has no preference to read. */
export function hydrateTheme(): void {
  const value = stored.read();
  theme.set(value);
  applyTheme(value);
}

/** What is actually on screen right now, which is not the same as the choice.
 *  A caller rendering "you are in dark mode" wants this; a caller rendering the
 *  control's own state wants the choice. */
export function resolvedTheme(choice: Theme): "light" | "dark" {
  if (choice !== "system") return choice;
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
