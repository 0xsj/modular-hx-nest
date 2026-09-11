import { mergeProps, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/kernel";
import { textVariants, type TextVariants } from "./text.variants";
export type TextProps = JSX.HTMLAttributes<HTMLElement> &
  TextVariants & {
    as?: "p" | "span" | "div";
  };
export function Text(incomingProps: TextProps) {
  const componentProps = mergeProps(
    {
      as: "p",
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "as",
    "size",
    "tone",
    "weight",
    "measure",
    "truncate",
    "class",
  ]);
  return (
    <Dynamic
      component={componentProps.as}
      class={cn(
        textVariants({
          size: componentProps.size,
          tone: componentProps.tone,
          weight: componentProps.weight,
          measure: componentProps.measure,
          truncate: componentProps.truncate,
        }),
        componentProps.class,
      )}
      {...props}
    />
  );
}
