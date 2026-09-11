import { mergeProps } from "solid-js";
import { VisuallyHidden } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./avatar.module.css";
export type AvatarProps = {
  /** The person's name. REQUIRED even when an image is present: it is the
   *  fallback's content and the image's alternative text, and an avatar with
   *  neither is a decorative circle claiming to identify somebody. */
  name: string;
  src?: string;
  size?: "sm" | "md";
  class?: string;
};
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
export function Avatar(incomingProps: AvatarProps) {
  const props = mergeProps(
    {
      size: "md",
    } as const,
    incomingProps,
  );
  return (
    <span
      class={cn(s.avatar, props.size === "sm" ? s.sm : s.md, props.class)}
      title={props.name}
    >
      {props.src ? (
        /* A plain img, not the framework's optimised one. This group is meant
       to copy to the sibling templates, and that component exists in one of
       the three. An avatar is small and usually already sized; a product
       that wants the optimiser swaps this one line, in one file. */
        <img class={s.image} src={props.src} alt={props.name} />
      ) : (
        <span class={s.initials} aria-hidden="true">
          {initials(props.name)}
        </span>
      )}
      {/* The initials are aria-hidden, so without this the avatar identifies
          nobody to a reader. One implementation of hiding, in utility. */}
      {props.src ? null : <VisuallyHidden>{props.name}</VisuallyHidden>}
    </span>
  );
}
