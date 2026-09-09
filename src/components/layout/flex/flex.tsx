import { ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { spaceStyle, splitSpace, type Space, type SpaceProps } from "../../style-props";

export type FlexProps = Omit<ComponentProps<typeof ark.div>, "style"> &
  SpaceProps & {
    /** `row` by default, matching the platform rather than the common case. */
    direction?: JSX.CSSProperties["flex-direction"];
    align?: JSX.CSSProperties["align-items"];
    justify?: JSX.CSSProperties["justify-content"];
    /** A STEP, not a length — the same scale everything else spaces on. */
    gap?: Space;
    wrap?: boolean;
    inline?: boolean;
    /** `flex: 1 1 0` on this element. The arrangement people reach for and
     *  misspell, and the one that makes a child actually share the space
     *  rather than merely be allowed to grow past its content. */
    grow?: boolean;
    style?: JSX.CSSProperties;
  };

export function Flex(props: FlexProps) {
  const [space, rest] = splitSpace(props);
  const [own, others] = splitProps(rest, [
    "direction", "align", "justify", "gap", "wrap", "inline", "grow", "style",
  ]);
  return (
    <ark.div
      {...others}
      style={{
        display: own.inline ? "inline-flex" : "flex",
        "flex-direction": own.direction,
        "align-items": own.align,
        "justify-content": own.justify,
        "flex-wrap": own.wrap ? "wrap" : undefined,
        gap: own.gap === undefined ? undefined : own.gap === 0 ? "0" : `var(--space-${own.gap})`,
        flex: own.grow ? "1 1 0" : undefined,
        /* Flex children refuse to shrink below their content by default, and
           the overflow that causes is invisible from the CSS — nothing in the
           author's rules mentions a minimum. */
        "min-inline-size": "0",
        ...spaceStyle(space),
        ...own.style,
      }}
    />
  );
}
