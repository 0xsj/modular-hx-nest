import { Menu as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import s from "./menu.module.css";

export type MenuProps = ComponentProps<typeof Ark.Root>;
export type MenuTriggerProps = ComponentProps<typeof Ark.Trigger>;
export type MenuItemProps = ComponentProps<typeof Ark.Item>;

/** A list of ACTIONS. Not a select — see doc.ts; the two look alike and are
 *  announced differently. */
export function Menu(props: MenuProps) {
  return <Ark.Root {...props} />;
}

export function MenuTrigger(props: MenuTriggerProps) {
  return <Ark.Trigger {...props} />;
}

export function MenuContent(props: { class?: string; children: JSX.Element }) {
  return (
    <Portal>
      <Ark.Positioner class={s.positioner}>
        <Ark.Content class={cn(s.content, props.class)}>{props.children}</Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}

export function MenuItem(props: MenuItemProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Item {...rest} class={cn(s.item, local.class)} />;
}

export function MenuSeparator(props: { class?: string }) {
  return <Ark.Separator class={cn(s.separator, props.class)} />;
}

export function MenuGroup(props: { label: string; class?: string; children: JSX.Element }) {
  return (
    <Ark.ItemGroup class={cn(s.group, props.class)}>
      {/* A group with a visible label needs the label WIRED, or it is a
          heading that happens to sit above some items. */}
      <Ark.ItemGroupLabel class={s.groupLabel}>{props.label}</Ark.ItemGroupLabel>
      {props.children}
    </Ark.ItemGroup>
  );
}
