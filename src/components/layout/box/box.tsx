import type { PolymorphicProps } from "@ark-ui/solid/factory";
import { ark } from "@ark-ui/solid/factory";
import { splitProps, type JSX } from "solid-js";
import { splitSpace, type SpaceProps } from "../../style-props";
export type BoxProps = JSX.HTMLAttributes<HTMLDivElement> &
  SpaceProps & {
    asChild?: PolymorphicProps<"div">["asChild"];
  };
export function Box(props: BoxProps) {
  const [local, others] = splitProps(props, ["asChild", "style"]);
  const [space, rest] = splitSpace(others);
  return (
    <ark.div
      {...rest}
      asChild={local.asChild}
      style={{
        ...space(),
        ...(typeof local.style === "object" ? local.style : {}),
      }}
    />
  );
}
