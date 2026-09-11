import type { PolymorphicProps } from "@ark-ui/solid/factory";
import { ark } from "@ark-ui/solid/factory";
import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./visually-hidden.module.css";
export type VisuallyHiddenProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  asChild?: PolymorphicProps<"span">["asChild"];
};
export function VisuallyHidden(props: VisuallyHiddenProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <ark.span {...rest} class={cn(s.hidden, local.class)} />;
}
