import { DENSITIES, useDensity, type Density } from "~/lib/runtime";
import { Segmented } from "../segmented";

export type DensityToggleProps = { labelHidden?: boolean; class?: string };

const OPTIONS = DENSITIES.map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
})) as readonly { value: Density; label: string }[];

/** The token override, over `lib/runtime`. Same shape as the theme control,
 *  and deliberately a separate component — see doc.ts. */
export function DensityToggle(props: DensityToggleProps) {
  const density = useDensity();
  return (
    <Segmented
      label="Density"
      labelHidden={props.labelHidden}
      class={props.class}
      options={OPTIONS}
      value={density.value()}
      onChange={density.set}
    />
  );
}
