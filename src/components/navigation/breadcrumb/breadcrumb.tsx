import { children, For, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./breadcrumb.module.css";
export type BreadcrumbProps = {
  label?: string;
  separator?: string;
  class?: string;
  children: JSX.Element;
};
export function Breadcrumb(props: BreadcrumbProps) {
  const items = children(() => props.children);
  return (
    <nav
      aria-label={props.label ?? "Breadcrumb"}
      class={cn(s.nav, props.class)}
    >
      <ol class={s.list}>
        <For each={items.toArray()}>
          {(item, index) => (
            <>
              {index() > 0 && (
                <li aria-hidden="true" class={s.separator}>
                  {props.separator ?? "/"}
                </li>
              )}
              <li class={s.item}>{item}</li>
            </>
          )}
        </For>
      </ol>
    </nav>
  );
}
export type BreadcrumbLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement>;
export function BreadcrumbLink(props: BreadcrumbLinkProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <a {...rest} class={cn(s.link, local.class)} />;
}
export function BreadcrumbCurrent(props: {
  class?: string;
  children: JSX.Element;
}) {
  return (
    <span aria-current="page" class={cn(s.current, props.class)}>
      {props.children}
    </span>
  );
}
