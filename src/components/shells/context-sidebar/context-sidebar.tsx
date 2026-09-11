import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import type { HeadingProps } from "~/components/typography";
import { Heading, Text } from "~/components/typography";
import { cn } from "~/lib/kernel";
import s from "./context-sidebar.module.css";
export type ContextSidebarProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  title: JSX.Element;
  description?: JSX.Element;
  footer?: JSX.Element;
  level?: HeadingProps["level"];
};
export function ContextSidebar(incomingProps: ContextSidebarProps) {
  const componentProps = mergeProps(
    {
      level: 2,
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "title",
    "description",
    "footer",
    "level",
    "children",
    "class",
  ]);
  const _descriptionSlot = createMemo(() => componentProps.description);
  const _footerSlot = createMemo(() => componentProps.footer);
  return (
    <div class={cn(s.sidebar, componentProps.class)} {...props}>
      <div class={s.header}>
        <Heading level={componentProps.level} size="sm">
          {componentProps.title}
        </Heading>
        {_descriptionSlot() && (
          <Text size="sm" tone="quiet">
            {_descriptionSlot()}
          </Text>
        )}
      </div>
      <div class={s.content}>{componentProps.children}</div>
      {_footerSlot() && <div class={s.footer}>{_footerSlot()}</div>}
    </div>
  );
}
