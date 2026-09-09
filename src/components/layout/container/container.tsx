import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { spaceStyle, splitSpace, type SpaceProps } from "../../style-props";
import s from "./container.module.css";

export type ContainerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "style"> &
  SpaceProps & {
    /** `page` is the full working width. `measure` is a READING column, capped
     *  in characters rather than pixels because that is what legibility
     *  depends on. Both are tokens. */
    width?: "page" | "measure";
    style?: JSX.CSSProperties;
  };

/** Centres content and caps its width — the only layout decision this group
 *  makes on a screen's behalf. See doc.ts for why this one is not arrangement. */
export function Container(props: ContainerProps) {
  const [space, rest] = splitSpace(props);
  const [own, others] = splitProps(rest, ["width", "class", "style"]);
  return (
    <div
      {...others}
      class={cn(s.container, own.width === "measure" ? s.measure : s.page, own.class)}
      style={{ ...spaceStyle(space), ...own.style }}
    />
  );
}
