import { createMemo, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "../charts.module.css";
export type ChartFrameProps = Omit<JSX.HTMLAttributes<HTMLElement>, "title"> & {
  title: JSX.Element;
  description?: JSX.Element;
  actions?: JSX.Element;
  legend?: JSX.Element;
  footer?: JSX.Element;
};
export function ChartFrame(componentProps: ChartFrameProps) {
  const [, props] = splitProps(componentProps, [
    "title",
    "description",
    "actions",
    "legend",
    "footer",
    "children",
    "class",
  ]);
  const _descriptionSlot = createMemo(() => componentProps.description);
  const _actionsSlot = createMemo(() => componentProps.actions);
  const _footerSlot = createMemo(() => componentProps.footer);
  return (
    <figure class={cn(s.frame, componentProps.class)} {...props}>
      <figcaption class={s.header}>
        <div>
          <div class={s.title}>{componentProps.title}</div>
          {_descriptionSlot() && (
            <div class={s.description}>{_descriptionSlot()}</div>
          )}
        </div>
        {_actionsSlot() && <div class={s.actions}>{_actionsSlot()}</div>}
      </figcaption>
      {componentProps.legend}
      <div class={s.plot}>{componentProps.children}</div>
      {_footerSlot() && <div class={s.footer}>{_footerSlot()}</div>}
    </figure>
  );
}
