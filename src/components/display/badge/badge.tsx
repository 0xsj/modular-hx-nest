import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { badgeVariants, type BadgeVariants } from "./badge.variants";
import s from "./badge.module.css";

export type BadgeProps = BadgeVariants & {
  /** A mark carried BESIDE the colour, so the badge survives greyscale, a
   *  projector, and a reader who cannot separate the hues. Hidden from
   *  assistive technology: the text is already the announcement. */
  glyph?: string;
  class?: string;
  children: JSX.Element;
};

/** A short, static label. See doc.ts — it is not a button and not a count. */
export function Badge(props: BadgeProps) {
  const [local, variants] = splitProps(props, ["class", "children", "glyph"]);
  return (
    <span class={cn(badgeVariants(variants), local.class)}>
      <Show when={local.glyph}>
        <span aria-hidden="true" class={s.glyph}>{local.glyph}</span>
      </Show>
      {local.children}
    </span>
  );
}
