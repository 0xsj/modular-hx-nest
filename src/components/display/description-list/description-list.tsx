import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./description-list.module.css";
export function DescriptionList(
  componentProps: JSX.HTMLAttributes<HTMLDListElement>,
) {
  const [, props] = splitProps(componentProps, ["class"]);
  return <dl class={cn(s.list, componentProps.class)} {...props} />;
}
export type DescriptionItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  term: JSX.Element;
};
export function DescriptionItem(componentProps: DescriptionItemProps) {
  const [, props] = splitProps(componentProps, ["term", "children", "class"]);
  return (
    <div class={cn(s.item, componentProps.class)} {...props}>
      <dt class={s.term}>{componentProps.term}</dt>
      <dd class={s.value}>{componentProps.children}</dd>
    </div>
  );
}
