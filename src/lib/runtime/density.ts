import { createStore, persisted } from "./store";

/* Density is a TOKEN override and nothing else.
 *
 * `styles/tokens/shape.css` redefines three control heights under
 * `[data-density="compact"]`, so a component reading `--control-md` gets the
 * compact one for free — and a component that hard-codes a height is now
 * visibly wrong. That is the whole reason this is three lines rather than a
 * prop threaded through every control.
 *
 * Per browser, never per account: nothing stores it on a server, and a screen
 * offering the choice should say so rather than imply a column that does not
 * exist. */
export const DENSITIES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

const stored = persisted<Density>("density", "comfortable", DENSITIES);

export const density = createStore<Density>("comfortable", (value) => {
  stored.write(value);
  applyDensity(value);
});

export function applyDensity(value: Density): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  if (value === "comfortable") delete root.dataset.density;
  else root.dataset.density = value;
}

export function hydrateDensity(): void {
  const value = stored.read();
  density.set(value);
  applyDensity(value);
}
