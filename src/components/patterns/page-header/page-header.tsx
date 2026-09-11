import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import type { HeadingProps } from "~/components/typography";
import { Heading, Text } from "~/components/typography";
import { cn } from "~/lib/kernel";
import s from "./page-header.module.css";
export type PageHeaderProps = Omit<JSX.HTMLAttributes<HTMLElement>, "title"> & {
  title: JSX.Element;
  description?: JSX.Element;
  leading?: JSX.Element;
  actions?: JSX.Element;
  level?: HeadingProps["level"];
};
export function PageHeader(incomingProps: PageHeaderProps) {
  const componentProps = mergeProps(
    {
      level: 1,
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "title",
    "description",
    "leading",
    "actions",
    "level",
    "class",
  ]);
  const _leadingSlot = createMemo(() => componentProps.leading);
  const _descriptionSlot = createMemo(() => componentProps.description);
  const _actionsSlot = createMemo(() => componentProps.actions);
  return (
    <header class={cn(s.header, componentProps.class)} {...props}>
      {_leadingSlot() ? <div class={s.leading}>{_leadingSlot()}</div> : null}
      <div class={s.row}>
        <div class={s.copy}>
          <Heading level={componentProps.level} size="lg">
            {componentProps.title}
          </Heading>
          {_descriptionSlot() ? (
            <Text tone="muted" measure>
              {_descriptionSlot()}
            </Text>
          ) : null}
        </div>
        {_actionsSlot() ? <div class={s.actions}>{_actionsSlot()}</div> : null}
      </div>
    </header>
  );
}
