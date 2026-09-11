import { Menu as Ark } from "@ark-ui/solid/menu";
import type { JSX } from "solid-js";
import { createUniqueId, splitProps, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import s from "./dropdown-menu.module.css";
export type DropdownMenuProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void;
};
export function DropdownMenu(props: DropdownMenuProps) {
  const [local, rest] = splitProps(props, ["onOpenChange"]);
  return (
    <Ark.Root
      lazyMount
      unmountOnExit
      {...rest}
      positioning={{
        placement: "bottom-start",
        gutter: 6,
      }}
      onOpenChange={(d) => local.onOpenChange?.(d.open)}
    />
  );
}
export function DropdownMenuTrigger(props: ComponentProps<typeof Ark.Trigger>) {
  return <Ark.Trigger {...props} />;
}
export type DropdownMenuContentProps = ComponentProps<typeof Ark.Content> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
};
export function DropdownMenuContent(props: DropdownMenuContentProps) {
  const [local, rest] = splitProps(props, ["class", "sideOffset", "align"]);
  return (
    <Portal>
      <Ark.Positioner
        style={{
          "z-index": "var(--z-popover,60)",
        }}
      >
        <Ark.Content
          {...rest}
          class={cn(surface.elevated, s.content, local.class)}
        />
      </Ark.Positioner>
    </Portal>
  );
}
export type DropdownMenuItemProps = Omit<
  ComponentProps<typeof Ark.Item>,
  "value" | "onSelect"
> & {
  value?: string;
  onSelect?: (event: Event) => void;
};
export function DropdownMenuItem(props: DropdownMenuItemProps) {
  const id = createUniqueId();
  const [local, rest] = splitProps(props, ["class", "onSelect", "value"]);
  return (
    <Ark.Item
      {...rest}
      value={local.value ?? id}
      class={cn(s.item, local.class)}
      onClick={(event) => local.onSelect?.(event)}
    />
  );
}
export function DropdownMenuLabel(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div {...rest} class={cn(s.label, local.class)} />;
}
export function DropdownMenuSeparator(
  props: ComponentProps<typeof Ark.Separator>,
) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Separator {...rest} class={cn(s.separator, local.class)} />;
}
