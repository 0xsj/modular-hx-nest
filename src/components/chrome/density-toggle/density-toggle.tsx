import type { Density } from "~/lib/runtime";
import { DENSITIES } from "~/lib/runtime";
import { useDensity, useHydrateRuntime } from "~/lib/runtime/hooks";
import { Segmented } from "../segmented";
const LABELS: Record<Density, string> = {
  comfortable: "Comfortable",
  compact: "Compact",
};

/** The token override, over `lib/runtime`.
 *
 *  Two states, and it is still a group rather than a switch — because it sits
 *  beside the theme control and a switch beside a segmented group reads as a
 *  different KIND of setting rather than the same kind with fewer answers.
 *
 *  # It changes three token values and nothing else
 *
 *  `styles/tokens/shape.css` redefines the control heights under
 *  `[data-density="compact"]`, so every component reading `--control-md` gets
 *  the compact one for free — and a component that hard-coded a height is
 *  visibly wrong the moment this is switched. That is worth knowing before
 *  reaching for it as a review tool: it is one, and this page is where it works.
 *
 *  # Per browser, never per account
 *
 *  Nothing stores it on a server. A screen offering the choice should say so
 *  rather than imply a column that does not exist. */
export function DensityToggle() {
  useHydrateRuntime();
  const { value, set } = useDensity();
  return (
    <Segmented
      label="Density"
      value={value()}
      onChange={set}
      options={DENSITIES.map((v) => ({
        value: v,
        label: LABELS[v],
      }))}
    />
  );
}
