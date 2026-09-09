import { THEMES, useTheme, type Theme } from "~/lib/runtime";
import { Segmented } from "../segmented";

export type ThemeToggleProps = { labelHidden?: boolean; class?: string };

const OPTIONS = THEMES.map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
})) as readonly { value: Theme; label: string }[];

/** The three theme states, over `lib/runtime`.
 *
 *  It owns no state: the store is the source, and this is the control. See
 *  doc.ts for why `system` is one of the three rather than the absence of a
 *  choice. */
export function ThemeToggle(props: ThemeToggleProps) {
  const theme = useTheme();
  return (
    <Segmented
      label="Theme"
      labelHidden={props.labelHidden}
      class={props.class}
      options={OPTIONS}
      value={theme.choice()}
      onChange={theme.set}
    />
  );
}
