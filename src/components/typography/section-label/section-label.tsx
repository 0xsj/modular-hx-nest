import { Dynamic } from "solid-js/web";
import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./section-label.module.css";

export type SectionLabelProps = Omit<JSX.HTMLAttributes<HTMLElement>, "color"> & {
  /** `div` by default: a visual grouping mark is not part of the outline.
   *  Pass a heading level when it genuinely NAMES a region — see doc.ts. */
  as?: "div" | "span" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: JSX.Element;
};

/** The small uppercase mark above a group. */
export function SectionLabel(props: SectionLabelProps) {
  const [local, rest] = splitProps(props, ["as", "class", "children"]);
  return (
    <Dynamic component={local.as ?? "div"} {...rest} class={cn(s.label, local.class)}>
      {local.children}
    </Dynamic>
  );
}
