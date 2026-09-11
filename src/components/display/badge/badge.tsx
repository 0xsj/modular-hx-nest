import type { JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./badge.module.css";
import { badgeVariants, type BadgeVariants } from "./badge.variants";
export type BadgeProps = BadgeVariants & {
  /** A mark carried BESIDE the colour. Hidden from readers — the text is the
   *  announcement — and present so the badge survives being seen in greyscale
   *  or by somebody who cannot distinguish the hues. */
  glyph?: string;
  class?: string;
  children: JSX.Element;
};
export function Badge(props: BadgeProps) {
  return (
    <span
      class={cn(
        badgeVariants({
          tone: props.tone,
        }),
        props.class,
      )}
    >
      {props.glyph ? (
        <span class={s.glyph} aria-hidden="true">
          {props.glyph}
        </span>
      ) : null}
      {props.children}
    </span>
  );
}
