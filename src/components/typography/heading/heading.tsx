import { Dynamic } from "solid-js/web";
import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { headingVariants, type HeadingVariants } from "./heading.variants";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = HeadingVariants &
  Omit<JSX.HTMLAttributes<HTMLHeadingElement>, "color"> & {
    /** REQUIRED, and separate from `size`. This is the document's outline —
     *  see doc.ts for why it has no default. */
    level: HeadingLevel;
    children: JSX.Element;
  };

export function Heading(props: HeadingProps) {
  const [local, variants, rest] = splitProps(
    props,
    ["level", "class", "children"],
    ["size", "tone"],
  );
  return (
    <Dynamic
      component={`h${local.level}`}
      {...rest}
      class={cn(headingVariants(variants), local.class)}
    >
      {local.children}
    </Dynamic>
  );
}
