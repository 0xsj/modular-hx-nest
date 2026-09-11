import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./panel.module.css";
export type PanelProps = {
  title?: JSX.Element;
  /** Controls for the panel itself — not for a row inside it. */
  actions?: JSX.Element;
  /** Removes the body padding, for a panel whose child owns its own edges:
   *  a table, a chart, a list that draws its own dividers. */
  flush?: boolean;
  class?: string;
  children: JSX.Element;
};

/** The frame most screens are made of: a bounded region with a name. */
export function Panel(props: PanelProps) {
  const _titleSlot = createMemo(() => props.title);
  const _actionsSlot = createMemo(() => props.actions);
  return (
    <section class={cn(s.panel, props.class)}>
      {_titleSlot() || _actionsSlot() ? (
        <header class={s.head}>
          {_titleSlot() ? <h3 class={s.title}>{_titleSlot()}</h3> : <span />}
          {_actionsSlot() ? (
            <div class={s.actions}>{_actionsSlot()}</div>
          ) : null}
        </header>
      ) : null}
      <div class={cn(props.flush ? s.flush : s.body)}>{props.children}</div>
    </section>
  );
}
