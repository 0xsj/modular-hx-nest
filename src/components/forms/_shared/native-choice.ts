import type { JSX } from "solid-js";
/** Transparent native hit target; preserves keyboard, form and label semantics. */
export const nativeChoiceStyle: JSX.CSSProperties = {
  position: "absolute",
  inset: "0",
  width: "100%",
  height: "100%",
  opacity: 0,
  margin: 0,
  padding: 0,
  overflow: "visible",
  clip: "auto",
  "clip-path": "none",
  "z-index": 1,
  cursor: "inherit",
};

import { bindFormReset } from "./form-reset";
/** Native reset runs after the reset event. Restore the machine's settled
 * selection afterward, including controlled values that did not change. */
export function bindNativeChoiceReset(
  input: () => HTMLInputElement | undefined,
  state: () => { checked: boolean; indeterminate?: boolean },
) {
  bindFormReset(input, () => {
    const element = input();
    if (!element) return;
    const value = state();
    element.checked = value.checked;
    element.indeterminate = value.indeterminate ?? false;
  });
}
