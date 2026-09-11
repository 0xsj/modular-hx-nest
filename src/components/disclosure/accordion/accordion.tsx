import { Accordion as Ark } from "@ark-ui/solid/accordion";
import { splitProps, type ComponentProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { ChevronDown } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./accordion.module.css";
export type AccordionProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "value" | "defaultValue" | "onValueChange"
> & {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
};
const list = (v: string | string[] | undefined) =>
  v === undefined ? undefined : Array.isArray(v) ? v : [v];
export function Accordion(props: AccordionProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "type",
    "value",
    "defaultValue",
    "onValueChange",
  ]);
  return (
    <Ark.Root
      {...rest}
      class={cn(s.root, local.class)}
      multiple={local.type === "multiple"}
      value={list(local.value)}
      defaultValue={list(local.defaultValue)}
      onValueChange={(d) =>
        local.onValueChange?.(
          local.type === "multiple" ? d.value : (d.value[0] ?? ""),
        )
      }
    />
  );
}
export function AccordionItem(props: ComponentProps<typeof Ark.Item>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Item {...rest} class={cn(s.item, local.class)} />;
}
export type AccordionTriggerProps = ComponentProps<typeof Ark.ItemTrigger> & {
  level?: 2 | 3 | 4 | 5 | 6;
};
export function AccordionTrigger(props: AccordionTriggerProps) {
  const [local, rest] = splitProps(props, ["level", "class", "children"]);
  return (
    <Dynamic component={`h${local.level ?? 3}` as "h3"} class={s.heading}>
      <Ark.ItemTrigger {...rest} class={cn(s.trigger, local.class)}>
        <span>{local.children}</span>
        <ChevronDown size={14} class={s.chevron} aria-hidden="true" />
      </Ark.ItemTrigger>
    </Dynamic>
  );
}
export function AccordionContent(
  props: ComponentProps<typeof Ark.ItemContent>,
) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <Ark.ItemContent {...rest} class={cn(s.content, local.class)}>
      <div class={s.inner}>{local.children}</div>
    </Ark.ItemContent>
  );
}
