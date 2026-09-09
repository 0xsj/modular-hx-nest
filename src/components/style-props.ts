import { splitProps, type JSX } from "solid-js";

/* Spacing props shared by the layout group.
 *
 * The steps ARE the scale — a prop takes a step, never a length, so a screen
 * cannot introduce a thirteenth value. `0` is the one literal, because there
 * is no `--space-0` token and there should not be: zero is not a size. */
export const SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type Space = (typeof SPACE_STEPS)[number];
/** Margins additionally take `auto`, which is how centring and push-apart are
 *  expressed. Padding has no such value. */
export type Margin = Space | "auto";

export type SpaceProps = {
  p?: Space;
  /** Inline axis — both sides, in writing-direction terms. */
  px?: Space;
  /** Block axis. */
  py?: Space;
  pt?: Space;
  pb?: Space;
  /** Inline START — the left edge in a left-to-right language, the right in a
   *  right-to-left one. There is deliberately no `pl`; see doc.ts. */
  ps?: Space;
  pe?: Space;
  m?: Margin;
  mx?: Margin;
  my?: Margin;
  mt?: Margin;
  mb?: Margin;
  ms?: Margin;
  me?: Margin;
};

/* Order is load-bearing: these become style properties in insertion order, so
 * the broadest has to be written first or `p={4} pt={0}` would apply the 4
 * after the 0 and silently ignore the override. */
const PROPERTY: Record<keyof SpaceProps, string> = {
  p: "padding",
  px: "padding-inline",
  py: "padding-block",
  pt: "padding-block-start",
  pb: "padding-block-end",
  ps: "padding-inline-start",
  pe: "padding-inline-end",
  m: "margin",
  mx: "margin-inline",
  my: "margin-block",
  mt: "margin-block-start",
  mb: "margin-block-end",
  ms: "margin-inline-start",
  me: "margin-inline-end",
};

/* Written out rather than derived from `PROPERTY`, so the ORDER above is the
   order used here — `Object.keys` order is a guarantee about the object and
   not about the intent, and this one is load-bearing. */
export const SPACE_KEYS = [
  "p", "px", "py", "pt", "pb", "ps", "pe",
  "m", "mx", "my", "mt", "mb", "ms", "me",
] as const satisfies readonly (keyof SpaceProps)[];

const length = (value: Space | Margin): string =>
  value === "auto" ? "auto" : value === 0 ? "0" : `var(--space-${value})`;

/** Build the style object. Call it INSIDE the `style` prop rather than above
 *  the return: that position is tracked, so a step that changes updates the
 *  declaration instead of being read once at construction. */
export function spaceStyle(props: SpaceProps): JSX.CSSProperties {
  const style: Record<string, string> = {};
  for (const key of SPACE_KEYS) {
    const value = props[key];
    if (value !== undefined) style[PROPERTY[key]] = length(value);
  }
  return style;
}

/** Take the spacing props off, leaving everything the element itself accepts.
 *  Returns Solid's proxies, so reactivity survives the split. */
export function splitSpace<T extends SpaceProps>(props: T) {
  return splitProps(props, SPACE_KEYS);
}
