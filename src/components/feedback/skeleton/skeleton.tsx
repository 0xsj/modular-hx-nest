import type { JSX } from "solid-js";
import { mergeProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./skeleton.module.css";
export type SkeletonProps = {
  /** Any CSS length. Defaults to filling the container, which is usually right:
   *  a skeleton should be the size of the thing that is coming, and the
   *  container already knows that. */
  width?: string;
  height?: string;
  circle?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
};

/** A placeholder for content that has not arrived.
 *
 *  ALWAYS hidden from assistive technology. It carries no information — a
 *  reader hearing "loading" ten times from ten skeletons is worse off than one
 *  hearing nothing. The BUSY state belongs on the region, as `aria-busy`, which
 *  is one announcement instead of ten. */
export function Skeleton(props: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      class={cn(s.skeleton, props.circle && s.circle, props.class)}
      style={{
        "inline-size": props.width,
        "block-size": props.height,
        ...props.style,
      }}
    />
  );
}
export type SkeletonTextProps = {
  lines?: number;
  class?: string;
};

/** Text-shaped placeholder. The last line is short, because real paragraphs end
 *  mid-line and a block of equal bars reads as a table. */
export function SkeletonText(incomingProps: SkeletonTextProps) {
  const props = mergeProps(
    {
      lines: 3,
    } as const,
    incomingProps,
  );
  return (
    <span aria-hidden="true" class={cn(s.text, props.class)}>
      {Array.from(
        {
          length: Math.max(1, Math.floor(props.lines)),
        },
        (_, i) => (
          <span
            class={s.skeleton}
            style={{
              "inline-size":
                i === Math.max(1, Math.floor(props.lines)) - 1 ? "62%" : "100%",
            }}
          />
        ),
      )}
    </span>
  );
}
