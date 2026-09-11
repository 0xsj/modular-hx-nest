import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./separator.module.css";
export type SeparatorProps = JSX.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};
export function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "orientation",
    "decorative",
  ]);
  return (
    <div
      {...rest}
      role={local.decorative === false ? "separator" : "none"}
      aria-orientation={
        local.decorative === false
          ? (local.orientation ?? "horizontal")
          : undefined
      }
      data-orientation={local.orientation ?? "horizontal"}
      class={cn(s.separator, local.class)}
    />
  );
}
