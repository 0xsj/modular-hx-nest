import { Popover as Ark } from "@ark-ui/solid";
import { Show, splitProps, type ComponentProps, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import s from "./popover.module.css";

export type PopoverProps = ComponentProps<typeof Ark.Root>;
export type PopoverTriggerProps = ComponentProps<typeof Ark.Trigger>;

export function Popover(props: PopoverProps) {
  return <Ark.Root {...props} />;
}

export function PopoverTrigger(props: PopoverTriggerProps) {
  return <Ark.Trigger {...props} />;
}

export type PopoverContentProps = {
  /** REQUIRED, same reason as the dialog's: without one the popover is
   *  announced as an unnamed group. `titleHidden` hides it from the eye and
   *  keeps it for the reader. */
  title: JSX.Element;
  titleHidden?: boolean;
  description?: JSX.Element;
  class?: string;
  children: JSX.Element;
};

export function PopoverContent(props: PopoverContentProps) {
  const [local] = splitProps(props, ["title", "titleHidden", "description", "class", "children"]);
  return (
    /* Portalled, so an `overflow: hidden` ancestor cannot clip it — the
       commonest way a popover becomes unusable, and one no z-index fixes. */
    <Portal>
      <Ark.Positioner class={s.positioner}>
        <Ark.Content class={cn(s.content, local.class)}>
          <Ark.Title class={local.titleHidden ? s.hiddenTitle : s.title}>{local.title}</Ark.Title>
          <Show when={local.description}>
            <Ark.Description class={s.description}>{local.description}</Ark.Description>
          </Show>
          {local.children}
        </Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
