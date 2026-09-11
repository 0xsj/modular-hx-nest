import { createMemo, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./collection-toolbar.module.css";
export type CollectionToolbarProps = JSX.HTMLAttributes<HTMLDivElement> & {
  summary?: JSX.Element;
  actions?: JSX.Element;
};
/** A layout for separately labelled controls, not an ARIA toolbar with roving focus. */
export function CollectionToolbar(componentProps: CollectionToolbarProps) {
  const [, props] = splitProps(componentProps, [
    "children",
    "summary",
    "actions",
    "class",
  ]);
  const _summarySlot = createMemo(() => componentProps.summary);
  return (
    <div class={cn(s.toolbar, componentProps.class)} {...props}>
      <div class={s.controls}>{componentProps.children}</div>
      <div class={s.trailing}>
        {_summarySlot() ? <div class={s.summary}>{_summarySlot()}</div> : null}
        {componentProps.actions}
      </div>
    </div>
  );
}
