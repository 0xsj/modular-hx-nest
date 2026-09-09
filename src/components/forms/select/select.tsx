import {
  Select as Ark,
  createListCollection,
  type CollectionItem,
  type SelectRootProps,
} from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { Check, ChevronDown } from "~/components/utility";
import { cn } from "~/lib/kernel";
import { Label } from "../label";
import s from "./select.module.css";

/* A value bound to a form — NOT a menu. See doc.ts: the two look alike, are
 * different controls, and choosing wrong is announced wrong. */

export { createListCollection };

/* Generic over the item, and deliberately not `ComponentProps<typeof Root>`:
   that form resolves the type parameter to `unknown`, and because the
   collection is invariant in it, the component then accepts no collection any
   caller can actually build. The wrapper has to carry the parameter through. */
export type SelectProps<T extends CollectionItem = CollectionItem> = SelectRootProps<T>;
export type SelectItemProps = ComponentProps<typeof Ark.Item>;

export function Select<T extends CollectionItem>(props: SelectProps<T>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Root {...rest} class={cn(s.select, local.class)} />;
}

/** The library owns the id wiring, so the label part has to come from the
 *  library — but the LOOK is `Label`'s, handed over with `asChild` rather than
 *  restated in this stylesheet. Without this a Select could not be labelled at
 *  all: its trigger's id is generated, so an outside `<label for>` has nothing
 *  to point at. */
export function SelectLabel(props: { class?: string; children: JSX.Element }) {
  return (
    <Ark.Label
      asChild={(labelProps) => (
        <Label {...labelProps()} class={props.class}>{props.children}</Label>
      )}
    />
  );
}

export function SelectTrigger(props: { class?: string; children: JSX.Element }) {
  return (
    <Ark.Control>
      <Ark.Trigger class={cn(s.trigger, props.class)}>
        {props.children}
        <Ark.Indicator class={s.chevron}>
          <ChevronDown size={14} stroke-width={1.7} aria-hidden="true" />
        </Ark.Indicator>
      </Ark.Trigger>
    </Ark.Control>
  );
}

export function SelectValue(props: { placeholder?: string }) {
  return <Ark.ValueText placeholder={props.placeholder} class={s.value} />;
}

export function SelectContent(props: { class?: string; children: JSX.Element }) {
  return (
    /* Positioned in a portal, so an `overflow: hidden` ancestor cannot clip the
       list — the commonest way a select becomes unusable inside a scrolling
       panel, and one that no z-index fixes. */
    <Ark.Positioner>
      <Ark.Content class={cn(s.content, props.class)}>
        <Ark.List class={s.list}>{props.children}</Ark.List>
      </Ark.Content>
    </Ark.Positioner>
  );
}

export function SelectItem(props: SelectItemProps & { children?: JSX.Element }) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <Ark.Item {...rest} class={cn(s.item, local.class)}>
      <Ark.ItemText>{local.children}</Ark.ItemText>
      <Ark.ItemIndicator class={s.tick}>
        <Check size={13} stroke-width={2.4} aria-hidden="true" />
      </Ark.ItemIndicator>
    </Ark.Item>
  );
}

/** The form value. Without it a select is a styled div that submits nothing. */
export function SelectHiddenSelect() {
  return <Ark.HiddenSelect />;
}
