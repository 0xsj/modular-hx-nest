import { Show, createUniqueId, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./panel.module.css";

export type PanelProps = {
  title?: JSX.Element;
  /** Controls for the PANEL, not for a row inside it. */
  actions?: JSX.Element;
  /** Drops the body padding, for a child that owns its own edges — a table,
   *  a chart, a list drawing its own dividers. */
  flush?: boolean;
  class?: string;
  children: JSX.Element;
};

/** A titled region on a surface. See doc.ts for why it is a `section` with a
 *  name rather than a styled div. */
export function Panel(props: PanelProps) {
  const id = createUniqueId();
  return (
    <section
      class={cn(s.panel, props.class)}
      /* Absent when there is no title: a region with no accessible name is
         announced as an unnamed region, which is worse than not being a
         region at all — it is a landmark that tells you nothing. */
      aria-labelledby={props.title ? id : undefined}
    >
      <Show when={props.title || props.actions}>
        <header class={s.head}>
          <Show when={props.title}>
            <h2 id={id} class={s.title}>{props.title}</h2>
          </Show>
          <Show when={props.actions}>
            <div class={s.actions}>{props.actions}</div>
          </Show>
        </header>
      </Show>
      <div class={cn(s.body, props.flush && s.flush)}>{props.children}</div>
    </section>
  );
}
