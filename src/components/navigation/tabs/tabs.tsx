import { Tabs as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./tabs.module.css";

export type TabsProps = ComponentProps<typeof Ark.Root>;
export type TabProps = ComponentProps<typeof Ark.Trigger>;
export type TabPanelProps = ComponentProps<typeof Ark.Content>;

/** One panel at a time, WITHIN a page. Not for routes — see doc.ts. */
export function Tabs(props: TabsProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Root {...rest} class={cn(s.tabs, local.class)} />;
}

export function TabList(props: { class?: string; children: ComponentProps<typeof Ark.List>["children"] }) {
  return (
    <Ark.List class={cn(s.list, props.class)}>
      {props.children}
      {/* Follows the selected tab. Purely decorative — the selected state is
          already `aria-selected`, and this is the same fact drawn. */}
      <Ark.Indicator class={s.indicator} />
    </Ark.List>
  );
}

export function Tab(props: TabProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Trigger {...rest} class={cn(s.tab, local.class)} />;
}

export function TabPanel(props: TabPanelProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Content {...rest} class={cn(s.panel, local.class)} />;
}
