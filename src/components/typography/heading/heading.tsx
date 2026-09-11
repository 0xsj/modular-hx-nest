import { createMemo, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/kernel";
import { headingVariants, type HeadingVariants } from "./heading.variants";
export type HeadingProps = JSX.HTMLAttributes<HTMLHeadingElement> &
  HeadingVariants & {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
export function Heading(componentProps: HeadingProps) {
  const [, props] = splitProps(componentProps, ["level", "size", "class"]);
  const Tag = createMemo(() => `h${componentProps.level}` as const);
  return (
    <Dynamic
      component={Tag()}
      class={cn(
        headingVariants({
          size: componentProps.size,
        }),
        componentProps.class,
      )}
      {...props}
    />
  );
}
