import { Toggle as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import { toggleVariants, type ToggleVariants } from "./toggle.variants";

export type ToggleProps = ComponentProps<typeof Ark.Root> & ToggleVariants;

/** A button that stays pressed. Not a switch, and not a checkbox — it changes
 *  what you SEE rather than what the system does or what a form submits. */
export function Toggle(props: ToggleProps) {
  const [local, rest] = splitProps(props, ["size", "shape", "class"]);
  return (
    <Ark.Root
      {...rest}
      class={cn(toggleVariants({ size: local.size, shape: local.shape }), local.class)}
    />
  );
}
