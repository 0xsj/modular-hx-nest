import { Dialog as Ark } from "@ark-ui/solid";
import { Show, splitProps, type ComponentProps, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { X } from "~/components/utility";
import { VisuallyHidden } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./dialog.module.css";

export type DialogProps = ComponentProps<typeof Ark.Root>;
export type DialogTriggerProps = ComponentProps<typeof Ark.Trigger>;
export type DialogCloseProps = ComponentProps<typeof Ark.CloseTrigger>;

/** The state and the behaviour. Modal by default, which is what makes it trap
 *  focus, lock scroll and close on an outside press — see doc.ts. */
export function Dialog(props: DialogProps) {
  return <Ark.Root {...props} />;
}

export function DialogTrigger(props: DialogTriggerProps) {
  return <Ark.Trigger {...props} />;
}

export function DialogClose(props: DialogCloseProps) {
  return <Ark.CloseTrigger {...props} />;
}

export type DialogContentProps = {
  /** REQUIRED. A dialog with no accessible name is announced as "dialog" and
   *  nothing else — see doc.ts. Hide it visually with `titleHidden`; do not
   *  omit it. */
  title: JSX.Element;
  titleHidden?: boolean;
  description?: JSX.Element;
  /** The ✕. Absent for a dialog that must be answered rather than escaped —
   *  though Escape still works, and should. */
  closable?: boolean;
  closeLabel?: string;
  footer?: JSX.Element;
  class?: string;
  children: JSX.Element;
};

/** Everything below the root, in one piece: portal, backdrop, positioner,
 *  content, title. Bundled because a caller who assembles them by hand
 *  forgets the backdrop or the portal, and both fail in ways that look like a
 *  styling problem. */
export function DialogContent(props: DialogContentProps) {
  const [local] = splitProps(props, [
    "title", "titleHidden", "description", "closable", "closeLabel", "footer", "class", "children",
  ]);
  return (
    <Portal>
      <Ark.Backdrop class={s.backdrop} />
      {/* The positioner is a full-viewport flex box; the content is what has
          a size. Centring on the content itself fights the scroll. */}
      <Ark.Positioner class={s.positioner}>
        <Ark.Content class={cn(s.content, local.class)}>
          <header class={s.head}>
            <Show
              when={!local.titleHidden}
              fallback={<VisuallyHidden><Ark.Title>{local.title}</Ark.Title></VisuallyHidden>}
            >
              <Ark.Title class={s.title}>{local.title}</Ark.Title>
            </Show>
            <Show when={local.closable !== false}>
              <Ark.CloseTrigger class={s.close} aria-label={local.closeLabel ?? "Close"}>
                <X size={15} aria-hidden="true" />
              </Ark.CloseTrigger>
            </Show>
          </header>

          <Show when={local.description}>
            <Ark.Description class={s.description}>{local.description}</Ark.Description>
          </Show>

          <div class={s.body}>{local.children}</div>

          <Show when={local.footer}>
            <footer class={s.footer}>{local.footer}</footer>
          </Show>
        </Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
