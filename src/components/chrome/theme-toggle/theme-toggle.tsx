import type { Theme } from "~/lib/runtime";
import { THEMES } from "~/lib/runtime";
import { useHydrateRuntime, useTheme } from "~/lib/runtime/hooks";
import { Segmented } from "../segmented";
const LABELS: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/** The three theme states, over `lib/runtime`.
 *
 *  # Three, and `system` is one of them
 *
 *  "Follow the operating system" is a choice, not the absence of one. A user
 *  who picked it wants the page to change when their OS does; a user who picked
 *  `light` wants it not to. A two-state control cannot hold that difference and
 *  there is no way to recover it afterwards, which is why this is a group of
 *  three rather than a switch.
 *
 *  # It hydrates itself
 *
 *  Reading storage during render is a hydration mismatch — the server has no
 *  preference — so the stored choice arrives after mount. Doing that here
 *  rather than in the shell means the control works wherever it is dropped;
 *  every hydrate is idempotent, so a second one costs a storage read.
 *
 *  What it does NOT fix is the first paint: by the time this mounts, the page
 *  has already been painted once. The blocking script in the root layout is
 *  what prevents the flash, and this component is why that script exists. */
export function ThemeToggle() {
  useHydrateRuntime();
  const { choice, set } = useTheme();
  return (
    <Segmented
      label="Theme"
      value={choice()}
      onChange={set}
      options={THEMES.map((value) => ({
        value,
        label: LABELS[value],
      }))}
    />
  );
}
