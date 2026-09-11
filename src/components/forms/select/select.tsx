import { Select as Ark, createListCollection } from "@ark-ui/solid/select";
import type { JSX } from "solid-js";
import { createMemo, splitProps, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Check, ChevronDown } from "~/components/utility";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import s from "./select.module.css";
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
export type SelectProps = Omit<
  ComponentProps<typeof Ark.Root<SelectOption>>,
  "collection" | "value" | "defaultValue" | "onValueChange" | "children"
> & {
  items: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: JSX.Element;
};
export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, [
    "items",
    "value",
    "defaultValue",
    "onValueChange",
    "children",
  ]);
  const collection = createMemo(() =>
    createListCollection({
      items: [...local.items],
    }),
  );
  return (
    <Ark.Root
      lazyMount
      unmountOnExit
      {...rest}
      collection={collection()}
      value={
        local.value === undefined ? undefined : local.value ? [local.value] : []
      }
      defaultValue={local.defaultValue ? [local.defaultValue] : []}
      onValueChange={(d) => local.onValueChange?.(d.value[0] ?? "")}
      positioning={{
        placement: "bottom-start",
        gutter: 6,
      }}
    >
      {local.children}
      <Ark.HiddenSelect />
    </Ark.Root>
  );
}
export function SelectValue(props: { placeholder?: string }) {
  return <Ark.ValueText placeholder={props.placeholder} />;
}
export type SelectTriggerProps = ComponentProps<typeof Ark.Trigger>;
export function SelectTrigger(props: SelectTriggerProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <Ark.Control>
      <Ark.Trigger {...rest} class={cn(s.trigger, local.class)}>
        {local.children}
        <Ark.Indicator>
          <ChevronDown size={14} class={s.chevron} aria-hidden="true" />
        </Ark.Indicator>
      </Ark.Trigger>
    </Ark.Control>
  );
}
export type SelectContentProps = ComponentProps<typeof Ark.Content>;
export function SelectContent(props: SelectContentProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <Portal>
      <Ark.Positioner
        style={{
          "z-index": "var(--z-popover, 60)",
        }}
      >
        <Ark.Content
          {...rest}
          class={cn(surface.elevated, s.content, local.class)}
        >
          <Ark.List class={s.viewport}>{local.children}</Ark.List>
        </Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
export type SelectItemProps = {
  value: string;
  disabled?: boolean;
  class?: string;
  children: JSX.Element;
};
export function SelectItem(props: SelectItemProps) {
  const _childrenSlot = createMemo(() => props.children);
  return (
    <Ark.Item
      item={{
        value: props.value,
        label:
          typeof _childrenSlot() === "string" ? _childrenSlot() : props.value,
        disabled: props.disabled,
      }}
      class={cn(s.item, props.class)}
    >
      <Ark.ItemText>{_childrenSlot()}</Ark.ItemText>
      <Ark.ItemIndicator>
        <Check size={13} class={s.tick} aria-hidden="true" />
      </Ark.ItemIndicator>
    </Ark.Item>
  );
}
