import { For, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./skeleton.module.css";

export type SkeletonProps = {
  /** Any CSS length. Defaults to filling the container, which is usually
   *  right: a skeleton should be the size of the thing that is coming, and the
   *  container already knows that. */
  width?: string;
  height?: string;
  circle?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
};

/** A shape standing in for content that has not arrived. DECORATIVE — it is
 *  hidden from readers, and it is not a loading announcement. See doc.ts. */
export function Skeleton(props: SkeletonProps) {
  const [local] = splitProps(props, ["width", "height", "circle", "class", "style"]);
  return (
    <span
      aria-hidden="true"
      class={cn(s.skeleton, local.circle && s.circle, local.class)}
      style={{
        "inline-size": local.width,
        "block-size": local.height,
        ...local.style,
      }}
    />
  );
}

export type SkeletonTextProps = { lines?: number; class?: string };

/** Text-shaped placeholder. The last line is short, because real paragraphs
 *  end mid-line and a stack of equal bars reads as a table. */
export function SkeletonText(props: SkeletonTextProps) {
  const lines = () => Math.max(1, props.lines ?? 3);
  return (
    <span aria-hidden="true" class={cn(s.text, props.class)}>
      <For each={Array.from({ length: lines() }, (_, i) => i)}>
        {(i) => (
          <span
            class={s.skeleton}
            style={{ "inline-size": i === lines() - 1 ? "62%" : "100%" }}
          />
        )}
      </For>
    </span>
  );
}
