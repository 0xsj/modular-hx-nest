import { Tabs as Ark } from "@ark-ui/solid/tabs";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./tabs.module.css";
export type TabsProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onValueChange"
> & {
  onValueChange?: (value: string) => void;
};
export function Tabs(props: TabsProps) {
  const [local, rest] = splitProps(props, ["class", "onValueChange"]);
  return (
    <Ark.Root
      {...rest}
      class={cn(s.root, local.class)}
      onValueChange={(d) => local.onValueChange?.(d.value)}
    />
  );
}
export function TabsList(props: ComponentProps<typeof Ark.List>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.List {...rest} class={cn(s.list, local.class)} />;
}
export function Tab(props: ComponentProps<typeof Ark.Trigger>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Trigger {...rest} class={cn(s.tab, local.class)} />;
}
export function TabPanel(props: ComponentProps<typeof Ark.Content>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Content {...rest} class={cn(s.panel, local.class)} />;
}
export { TabsList as TabList };
export type TabsListProps = ComponentProps<typeof Ark.List>;
export type TabProps = ComponentProps<typeof Ark.Trigger>;
export type TabPanelProps = ComponentProps<typeof Ark.Content>;
