import type { JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./label.module.css";

export type LabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement>;

/** The only labelling implementation in the tree.
 *
 *  A plain `<label>` rather than a wrapped primitive: the headless library's
 *  label exists to add click-to-focus for controls the platform does not handle
 *  natively, and every control in this group either is a native element or
 *  brings its own label part. Wrapping one here would add a dependency to own a
 *  class. */
export function Label(props: LabelProps) {
  return <label {...props} class={cn(s.label, props.class)} />;
}
