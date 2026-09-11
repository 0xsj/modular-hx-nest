import { mergeProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/kernel";
import { markVariants, type MarkVariants } from "./mark.variants";

/** The name of the product, spelled once. */
export const MARK = "flover";
export type MarkProps = MarkVariants & {
  /** The element, which is the CALLER's fact and not this component's.
   *
   *  On a landing page the wordmark IS the page's heading; in a header beside a
   *  navigation it is a lockup and a heading would be a lie. A component that
   *  hard-codes one of those gives a document either two `h1`s or none, and
   *  nothing in a visual review shows which.
   *
   *  A closed list rather than any element: three cases exist, and an open one
   *  is how a component becomes a styled div. */
  as?: "span" | "h1" | "h2";
  class?: string;
};

/** The wordmark, in one place.
 *
 *  # `as`, not `asChild`
 *
 *  The rest of this design system uses `asChild`, where the caller supplies the
 *  element AND its content. Here the content is the whole point — the spelling
 *  and the casing are what this component is for — so the caller supplies only
 *  the element. Using `asChild` would mean writing "flover" at every call site,
 *  which is the duplication this exists to end. */
export function Mark(incomingProps: MarkProps) {
  const props = mergeProps(
    {
      as: "span",
    } as const,
    incomingProps,
  );
  return (
    <Dynamic
      component={props.as}
      class={cn(
        markVariants({
          size: props.size,
        }),
        props.class,
      )}
    >
      {MARK}
    </Dynamic>
  );
}
