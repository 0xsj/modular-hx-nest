import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./section-label.module.css";
export function SectionLabel(
  componentProps: JSX.HTMLAttributes<HTMLParagraphElement>,
) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <p class={cn(s.label, componentProps.class)} {...props} />;
}
