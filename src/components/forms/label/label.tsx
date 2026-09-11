import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./label.module.css";
export type LabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement>;
export function Label(props: LabelProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <label class={cn(s.label, local.class)} {...rest} />;
}
