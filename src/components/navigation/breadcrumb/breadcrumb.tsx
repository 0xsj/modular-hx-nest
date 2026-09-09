import { For, Show, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./breadcrumb.module.css";

export type Crumb = {
  label: string;
  /** Absent means "not linkable" — an intermediate step with no page of its
   *  own renders as plain text rather than as a link that goes nowhere. */
  href?: string;
};

export type BreadcrumbProps = {
  /** The trail, root first. The LAST is the current page, and the component
   *  marks it — see doc.ts for why this is data rather than children. */
  items: readonly Crumb[];
  /** Distinguishes this from the other navigation landmarks on the page. */
  label?: string;
  class?: string;
};

export function Breadcrumb(props: BreadcrumbProps) {
  const last = () => props.items.length - 1;
  return (
    /* A `nav` landmark, named — a page has several, and "navigation" repeated
       four times in a landmark list identifies none of them. */
    <nav aria-label={props.label ?? "Breadcrumb"} class={cn(s.breadcrumb, props.class)}>
      {/* Ordered, because the sequence IS the meaning: a reader is told "list
          of 4 items" and the position is the depth. */}
      <ol class={s.list}>
        <For each={props.items}>
          {(item, i) => (
            <li class={s.item}>
              <Show when={i() > 0}>
                {/* Drawn, never spoken. A reader announcing "slash" between
                    every step turns four words into eight. */}
                <span aria-hidden="true" class={s.separator}>/</span>
              </Show>
              <Crumb item={item} current={i() === last()} />
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}

function Crumb(props: { item: Crumb; current: boolean }): JSX.Element {
  return (
    <Show
      when={!props.current && props.item.href}
      fallback={
        /* The current page is NOT a link. A link to where you already are is
           an affordance that does nothing, and it is the one every breadcrumb
           gets wrong. `aria-current="page"` is what makes the last step
           findable rather than merely last. */
        <span class={s.current} aria-current={props.current ? "page" : undefined}>
          {props.item.label}
        </span>
      }
    >
      {/* A plain anchor, not the router's `A`. Two reasons, both measured:
          `A` injects the GLOBAL class names "active"/"inactive", and it sets
          `aria-current="page"` itself on any href equal to the current URL —
          which would put a second current-page claim in a trail whose whole
          contract is that there is exactly one. The router intercepts ordinary
          anchors anyway, so nothing is lost. See doc.ts. */}
      {(href) => <a href={href()} class={s.link}>{props.item.label}</a>}
    </Show>
  );
}
