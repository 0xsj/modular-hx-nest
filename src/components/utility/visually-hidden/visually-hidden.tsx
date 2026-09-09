import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./visually-hidden.module.css";

export type VisuallyHiddenProps = JSX.HTMLAttributes<HTMLSpanElement>;

/** Text for readers only. NOT `display:none` and not `hidden` — both remove it
 *  from the accessibility tree, which is the opposite of the intent. See
 *  doc.ts for why the clip rectangle looks the way it does. */
export function VisuallyHidden(props: VisuallyHiddenProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <span {...rest} class={cn(s.visuallyHidden, local.class)} />;
}
