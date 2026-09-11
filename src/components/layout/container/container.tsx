import type { PolymorphicProps } from "@ark-ui/solid/factory";
import { ark } from "@ark-ui/solid/factory";
import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { splitSpace, type SpaceProps } from "../../style-props";
import s from "./container.module.css";
export type ContainerProps = JSX.HTMLAttributes<HTMLDivElement> &
  SpaceProps & {
    asChild?: PolymorphicProps<"div">["asChild"];
    width?: "page" | "measure";
  };
export function Container(props: ContainerProps) {
  const [local, others] = splitProps(props, [
    "asChild",
    "class",
    "style",
    "width",
  ]);
  const [space, rest] = splitSpace(others);
  return (
    <ark.div
      {...rest}
      asChild={local.asChild}
      class={cn(
        s.container,
        local.width === "measure" ? s.measure : s.page,
        local.class,
      )}
      style={{
        ...space(),
        ...(typeof local.style === "object" ? local.style : {}),
      }}
    />
  );
}
