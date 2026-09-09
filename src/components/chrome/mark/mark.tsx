import { A } from "@solidjs/router";
import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./mark.module.css";

/** The product's name, in ONE place. Renaming is this line. */
export const PRODUCT_NAME = "Flover";

export type MarkProps = {
  name?: string;
  /** When given, the mark is a link. Its accessible name then says where it
   *  goes — see doc.ts; "Flover" alone is not a destination. */
  href?: string;
  size?: "sm" | "md";
  class?: string;
} & Omit<JSX.HTMLAttributes<HTMLElement>, "color">;

export function Mark(props: MarkProps) {
  const [local, rest] = splitProps(props, ["name", "href", "size", "class"]);
  const name = () => local.name ?? PRODUCT_NAME;
  const body = () => (
    <>
      {/* Decorative. The wordmark beside it is the name, and a reader that
          announces both says it twice. */}
      <span aria-hidden="true" class={s.glyph} />
      <span class={s.word}>{name()}</span>
    </>
  );

  return (
    <Show
      when={local.href}
      fallback={
        <span {...rest} class={cn(s.mark, local.size === "sm" ? s.sm : s.md, local.class)}>
          {body()}
        </span>
      }
    >
      {(href) => (
        <A
          href={href()}
          /* Says where it GOES. A link named only "Flover" is announced as a
             link to a word. */
          aria-label={`${name()}, home`}
          class={cn(s.mark, s.link, local.size === "sm" ? s.sm : s.md, local.class)}
          /* The router's defaults are the global class names. */
          activeClass=""
          inactiveClass=""
          end
        >
          {body()}
        </A>
      )}
    </Show>
  );
}
