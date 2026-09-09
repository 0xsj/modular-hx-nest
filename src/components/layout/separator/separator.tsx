import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./separator.module.css";

export type SeparatorProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "role"> & {
  orientation?: "horizontal" | "vertical";
  /** Default. A line that only reinforces grouping the structure already
   *  states is noise in the accessibility tree — see doc.ts. */
  decorative?: boolean;
};

export function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, ["orientation", "decorative", "class"]);
  const vertical = () => local.orientation === "vertical";
  const decorative = () => local.decorative !== false;
  return (
    <div
      {...rest}
      class={cn(s.separator, vertical() ? s.vertical : s.horizontal, local.class)}
      role={decorative() ? "none" : "separator"}
      /* Only meaningful on a real separator, and only worth stating when it
         is not the default the role already implies. */
      aria-orientation={!decorative() && vertical() ? "vertical" : undefined}
      aria-hidden={decorative() ? "true" : undefined}
    />
  );
}
