import { splitProps, type JSX } from "solid-js";
type CSSProperties = JSX.CSSProperties;

/* Shorthand style props, and the two rules that keep them from becoming a
 * utility layer.
 *
 *   1. They resolve to the EXISTING tokens. `p={3}` is `var(--space-3)`, not a
 *      number this file decided on. There is no second scale to keep in step.
 *   2. They emit an inline style, so nothing is added to the cascade. No
 *      generated stylesheet, no new layer, no specificity to reason about — and
 *      `@layer primitive` is untouched by a caller adjusting a gap.
 *
 * Scope is deliberately SPACING AND FLOW ONLY. No colour, no type, no borders,
 * no radii. Those are a component's own decisions and belong in its module,
 * where they can be reviewed as a set; a prop for them would let a screen
 * restyle a primitive from the outside, which is the thing the layer model
 * exists to prevent.
 */

export const SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Space = (typeof SPACE_STEPS)[number];
export type Margin = Space | "auto";

/* The edge shorthands are LOGICAL, not physical.
 *
 * `pl` is inline-start, not left. In a left-to-right document they are the same
 * thing, which is why the familiar letters are kept; in a right-to-left one the
 * padding follows the text instead of staying on the west side of the screen.
 * Physical names would be a lie that only shows up in a language nobody on the
 * team reads. */
export type SpaceProps = {
  p?: Space;
  px?: Space;
  py?: Space;
  pt?: Space;
  pb?: Space;
  pl?: Space;
  pr?: Space;
  m?: Margin;
  mx?: Margin;
  my?: Margin;
  mt?: Margin;
  mb?: Margin;
  ml?: Margin;
  mr?: Margin;
  gap?: Space;
  gapX?: Space;
  gapY?: Space;
};

const SPACE_KEYS = [
  "p",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "m",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "gap",
  "gapX",
  "gapY",
] as const;

/** `0` is the literal zero rather than `var(--space-0)`, which does not exist —
 *  the scale starts at 1 because a zero-sized step is not a design decision. */
const value = (v: Space | Margin | undefined): string | undefined =>
  v === undefined
    ? undefined
    : v === "auto"
      ? "auto"
      : v === 0
        ? "0"
        : `var(--space-${v})`;

export function spaceStyle(values: SpaceProps): CSSProperties {
  const v = value;
  const style: CSSProperties = {
    padding: v(values.p),
    "padding-inline": v(values.px),
    "padding-block": v(values.py),
    "padding-block-start": v(values.pt),
    "padding-block-end": v(values.pb),
    "padding-inline-start": v(values.pl),
    "padding-inline-end": v(values.pr),
    margin: v(values.m),
    "margin-inline": v(values.mx),
    "margin-block": v(values.my),
    "margin-block-start": v(values.mt),
    "margin-block-end": v(values.mb),
    "margin-inline-start": v(values.ml),
    "margin-inline-end": v(values.mr),
    gap: v(values.gap),
    "column-gap": v(values.gapX),
    "row-gap": v(values.gapY),
  };
  // In a browser, assigning gap and then clearing an absent rowGap/columnGap
  // clears the shorthand too. Omit absent declarations, rather than asking
  // the binding to write empty longhands over a supplied shorthand on client mount.
  return Object.fromEntries(
    Object.entries(style).filter(([, value]) => value !== undefined),
  );
}

/** Split the space values off, so the rest can be spread onto a DOM element
 *  without React warning about attributes it does not recognise. */
export function splitSpace<T extends SpaceProps>(props: T) {
  const [local, rest] = splitProps(props, SPACE_KEYS);
  return [() => spaceStyle(local), rest] as const;
}
