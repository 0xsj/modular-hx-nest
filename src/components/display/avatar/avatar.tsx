import { Show, createSignal, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./avatar.module.css";

export type AvatarProps = {
  /** REQUIRED even with an image. It is the fallback's content and the
   *  image's alternative text — an avatar with neither is a coloured circle
   *  claiming to identify somebody. */
  name: string;
  src?: string;
  size?: "sm" | "md";
  class?: string;
} & Omit<JSX.HTMLAttributes<HTMLSpanElement>, "children">;

/** Initials from the first and last word — never the middle ones, which is
 *  what makes a three-part name give two letters rather than three. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0]!;
  const last = words[words.length - 1]!;
  /* Intl-safe: a code point, not a UTF-16 unit, so an emoji or an astral
     letter is not sliced in half into a replacement character. */
  const head = (w: string) => [...w][0] ?? "";
  return (words.length === 1 ? head(first) : head(first) + head(last)).toUpperCase();
}

export function Avatar(props: AvatarProps) {
  const [local, rest] = splitProps(props, ["name", "src", "size", "class"]);
  /* A broken src must fall back to the initials rather than to the browser's
     broken-image glyph, which says "this page is broken" about a person. */
  const [failed, setFailed] = createSignal(false);
  const showImage = () => Boolean(local.src) && !failed();

  return (
    <span
      {...rest}
      class={cn(s.avatar, local.size === "sm" ? s.sm : s.md, local.class)}
      /* The whole thing is one label. Without this the initials are read as
         loose letters — "J D" — beside a name that is already elsewhere. */
      role="img"
      aria-label={local.name}
      data-fallback={showImage() ? undefined : ""}
    >
      <Show
        when={showImage()}
        fallback={<span aria-hidden="true" class={s.initials}>{initialsOf(local.name)}</span>}
      >
        <img
          class={s.image}
          src={local.src}
          /* Empty: the wrapper carries the name, and repeating it here makes
             a reader say it twice. */
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </Show>
    </span>
  );
}
