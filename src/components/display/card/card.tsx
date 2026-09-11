import { ark, type PolymorphicProps } from "@ark-ui/solid/factory";
import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { HeadingProps } from "~/components/typography";
import { Heading } from "~/components/typography";
import { cn } from "~/lib/kernel";
import s from "./card.module.css";
export type CardProps = JSX.HTMLAttributes<HTMLElement> & {
  as?: "article" | "div";
};
export function Card(incomingProps: CardProps) {
  const componentProps = mergeProps(
    {
      as: "article",
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, ["as", "class"]);
  return (
    <Dynamic
      component={componentProps.as}
      class={cn(s.card, componentProps.class)}
      {...props}
    />
  );
}
export type CardHeaderProps = JSX.HTMLAttributes<HTMLDivElement> & {
  leading?: JSX.Element;
  actions?: JSX.Element;
};
export function CardHeader(componentProps: CardHeaderProps) {
  const [, props] = splitProps(componentProps, [
    "leading",
    "actions",
    "children",
    "class",
  ]);
  const _leadingSlot = createMemo(() => componentProps.leading);
  const _actionsSlot = createMemo(() => componentProps.actions);
  return (
    <div class={cn(s.header, componentProps.class)} {...props}>
      {_leadingSlot() != null && <div class={s.leading}>{_leadingSlot()}</div>}
      <div class={s.heading}>{componentProps.children}</div>
      {_actionsSlot() != null && <CardAction>{_actionsSlot()}</CardAction>}
    </div>
  );
}
export function CardTitle(incomingProps: HeadingProps) {
  const componentProps = mergeProps(
    {
      size: "sm",
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, ["class", "size"]);
  return (
    <Heading
      size={componentProps.size}
      class={cn(s.title, componentProps.class)}
      {...props}
    />
  );
}
export function CardDescription(
  componentProps: JSX.HTMLAttributes<HTMLParagraphElement>,
) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <p class={cn(s.description, componentProps.class)} {...props} />;
}
export function CardBody(componentProps: JSX.HTMLAttributes<HTMLDivElement>) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <div class={cn(s.body, componentProps.class)} {...props} />;
}
export function CardFooter(componentProps: JSX.HTMLAttributes<HTMLDivElement>) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <div class={cn(s.footer, componentProps.class)} {...props} />;
}
export function CardMedia(componentProps: JSX.HTMLAttributes<HTMLDivElement>) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <div class={cn(s.media, componentProps.class)} {...props} />;
}
export function CardAction(componentProps: JSX.HTMLAttributes<HTMLDivElement>) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <div class={cn(s.action, componentProps.class)} {...props} />;
}
export type CardLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> &
  PolymorphicProps<"a">;
/** One primary destination. Other controls belong in CardAction/CardFooter. */
export function CardLink(componentProps: CardLinkProps) {
  const [, props] = splitProps(componentProps, ["asChild", "class"]);
  return (
    <ark.a
      asChild={componentProps.asChild}
      class={cn(s.link, componentProps.class)}
      {...props}
    />
  );
}
