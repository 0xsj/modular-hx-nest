import type { JSX } from "solid-js";
import { VisuallyHidden } from "../visually-hidden";
export type AccessibleIconProps = {
  label: string;
  children: JSX.Element;
};
export function AccessibleIcon(props: AccessibleIconProps) {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: "contents",
        }}
      >
        {props.children}
      </span>
      <VisuallyHidden>{props.label}</VisuallyHidden>
    </>
  );
}
