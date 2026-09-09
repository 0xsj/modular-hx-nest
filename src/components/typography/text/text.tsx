import { Dynamic } from "solid-js/web";
import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./text.module.css";
import { textVariants, type TextVariants } from "./text.variants";

export type TextProps = TextVariants &
  Omit<JSX.HTMLAttributes<HTMLElement>, "color"> & {
    /** `p` by default. `span` for text inside a sentence — a `p` nested in a
     *  paragraph is invalid and the browser silently closes the outer one. */
    as?: "p" | "span" | "div" | "small" | "strong" | "em";
    /** Clamp to N lines. See doc.ts: truncated text needs the full value
     *  somewhere, and this component cannot supply it. */
    lines?: number;
    children: JSX.Element;
  };

export function Text(props: TextProps) {
  const [local, variants, rest] = splitProps(
    props,
    ["as", "lines", "class", "children", "style"],
    ["size", "tone", "weight", "mono"],
  );
  return (
    <Dynamic
      component={local.as ?? "p"}
      {...rest}
      class={cn(textVariants(variants), local.lines !== undefined && s.clamp, local.class)}
      /* The clamp lives in the stylesheet and only the COUNT comes through
         here, as a custom property. Setting the `-webkit-` properties inline
         goes through the CSSOM, which silently drops the ones it does not
         recognise — leaving `overflow: hidden` and no clamp at all. A custom
         property is never dropped, and in CSS the prefixed declarations are
         just text. */
      style={{
        ...(local.lines !== undefined ? { "--text-clamp-lines": String(local.lines) } : {}),
        ...(local.style as JSX.CSSProperties),
      }}
    >
      {local.children}
    </Dynamic>
  );
}
