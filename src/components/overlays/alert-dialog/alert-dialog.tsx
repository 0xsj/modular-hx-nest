import { Dialog as Ark } from "@ark-ui/solid/dialog";
import type { JSX } from "solid-js";
import { createUniqueId, splitProps, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import type { DialogProps } from "../dialog";
import o from "../overlay.module.css";
export type AlertDialogProps = DialogProps;
export function AlertDialog(props: AlertDialogProps) {
  const [local, rest] = splitProps(props, [
    "onOpenChange",
    "id",
    "ids",
    "initialFocusEl",
  ]);
  const generated = createUniqueId();
  const contentId = () =>
    local.ids?.content ?? `${local.id ?? generated}-content`;
  return (
    <Ark.Root
      lazyMount
      unmountOnExit
      {...rest}
      id={local.id ?? generated}
      ids={{ ...local.ids, content: contentId() }}
      role="alertdialog"
      closeOnInteractOutside={false}
      onOpenChange={(d) => local.onOpenChange?.(d.open)}
      initialFocusEl={() =>
        local.initialFocusEl?.() ??
        document
          .getElementById(contentId())
          ?.querySelector<HTMLElement>("[data-alert-cancel]") ??
        null
      }
    />
  );
}
export function AlertDialogTrigger(props: ComponentProps<typeof Ark.Trigger>) {
  return <Ark.Trigger {...props} />;
}
export function AlertDialogCancel(
  props: ComponentProps<typeof Ark.CloseTrigger>,
) {
  return <Ark.CloseTrigger {...props} data-alert-cancel />;
}
export function AlertDialogAction(
  props: ComponentProps<typeof Ark.CloseTrigger>,
) {
  return <Ark.CloseTrigger {...props} />;
}
export type AlertDialogContentProps = Omit<
  ComponentProps<typeof Ark.Content>,
  "title"
> & {
  title: string;
  description: string;
  children: JSX.Element;
};
export function AlertDialogContent(props: AlertDialogContentProps) {
  const [local, rest] = splitProps(props, [
    "title",
    "description",
    "class",
    "children",
  ]);
  return (
    <Portal>
      <Ark.Backdrop class={o.scrim} />
      <Ark.Positioner>
        <Ark.Content
          {...rest}
          class={cn(surface.elevated, o.panel, local.class)}
        >
          <div class={o.head}>
            <Ark.Title class={o.title}>{local.title}</Ark.Title>
            <Ark.Description class={o.description}>
              {local.description}
            </Ark.Description>
          </div>
          <div class={o.footer}>{local.children}</div>
        </Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
