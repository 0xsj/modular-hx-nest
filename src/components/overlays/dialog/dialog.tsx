import { Dialog as Ark } from "@ark-ui/solid/dialog";
import type { JSX } from "solid-js";
import { createMemo, splitProps, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { VisuallyHidden, X } from "~/components/utility";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import o from "../overlay.module.css";
export type DialogProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void;
};
export function Dialog(props: DialogProps) {
  const [local, rest] = splitProps(props, ["onOpenChange"]);
  return (
    <Ark.Root
      lazyMount
      unmountOnExit
      {...rest}
      onOpenChange={(d) => local.onOpenChange?.(d.open)}
    />
  );
}
export type DialogTriggerProps = ComponentProps<typeof Ark.Trigger>;
export function DialogTrigger(props: DialogTriggerProps) {
  return <Ark.Trigger {...props} />;
}
export function DialogClose(props: ComponentProps<typeof Ark.CloseTrigger>) {
  return <Ark.CloseTrigger {...props} />;
}
export type DialogContentProps = Omit<
  ComponentProps<typeof Ark.Content>,
  "title"
> & {
  title: string;
  description?: string;
  hideTitle?: boolean;
  closeLabel?: string;
  children: JSX.Element;
};
export function DialogContent(props: DialogContentProps) {
  const [local, rest] = splitProps(props, [
    "title",
    "description",
    "hideTitle",
    "closeLabel",
    "class",
    "children",
  ]);
  const _descriptionSlot = createMemo(() => local.description);
  return (
    <Portal>
      <Ark.Backdrop class={o.scrim} />
      <Ark.Positioner>
        <Ark.Content
          {...rest}
          class={cn(surface.elevated, o.panel, local.class)}
        >
          <div class={o.head}>
            {local.hideTitle ? (
              <VisuallyHidden
                asChild={(p) => <Ark.Title {...p()}>{local.title}</Ark.Title>}
              />
            ) : (
              <Ark.Title class={o.title}>{local.title}</Ark.Title>
            )}
            {_descriptionSlot() && (
              <Ark.Description class={o.description}>
                {_descriptionSlot()}
              </Ark.Description>
            )}
          </div>
          <div class={o.body}>{local.children}</div>
          <Ark.CloseTrigger
            class={o.close}
            aria-label={local.closeLabel ?? "Close"}
          >
            <X size={14} aria-hidden="true" />
          </Ark.CloseTrigger>
        </Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
export function DialogFooter(props: { children: JSX.Element }) {
  return <div class={o.footer}>{props.children}</div>;
}
