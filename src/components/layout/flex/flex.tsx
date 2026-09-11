import type { PolymorphicProps } from "@ark-ui/solid/factory";
import { ark } from "@ark-ui/solid/factory";
import { splitProps, type JSX } from "solid-js";
import { splitSpace, type SpaceProps } from "../../style-props";
export type FlexProps = JSX.HTMLAttributes<HTMLDivElement> &
  SpaceProps & {
    asChild?: PolymorphicProps<"div">["asChild"];
    direction?: JSX.CSSProperties["flex-direction"];
    align?: JSX.CSSProperties["align-items"];
    justify?: JSX.CSSProperties["justify-content"];
    wrap?: boolean;
    inline?: boolean;
    grow?: boolean;
  };
export function Flex(props: FlexProps) {
  const [local, others] = splitProps(props, [
    "asChild",
    "direction",
    "align",
    "justify",
    "wrap",
    "inline",
    "grow",
    "style",
  ]);
  const [space, rest] = splitSpace(others);
  return (
    <ark.div
      {...rest}
      asChild={local.asChild}
      style={{
        display: local.inline ? "inline-flex" : "flex",
        "flex-direction": local.direction,
        "align-items": local.align,
        "justify-content": local.justify,
        "flex-wrap": local.wrap ? "wrap" : undefined,
        "flex-grow": local.grow ? 1 : undefined,
        "flex-shrink": local.grow ? 1 : undefined,
        "flex-basis": local.grow ? "0" : undefined,
        "min-inline-size": local.grow ? "0" : undefined,
        ...space(),
        ...(typeof local.style === "object" ? local.style : {}),
      }}
    />
  );
}
