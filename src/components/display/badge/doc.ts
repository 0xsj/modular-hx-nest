/**
 * Badge — a short, static label.
 *
 * # Colour is never the only carrier
 *
 * A badge exists to make a status findable at a glance, and the glance is the
 * problem: the fastest channel is hue, and hue is the one channel that fails
 * quietly. Roughly one in twelve men cannot separate the red from the green
 * reliably, a projector washes out the tints, and greyscale printing collapses
 * all five tones into two.
 *
 * So the text is mandatory and the colour is redundant with it. `glyph` is a
 * third channel for the cases where the word is small and the meaning is
 * urgent, and it is `aria-hidden` because the text already says it — a reader
 * announcing "check accepted" has been told twice.
 *
 * **The tones are named for MEANING, not appearance.** `crit` survives the day
 * the palette changes; `red` becomes a lie at that moment, and a variant named
 * `red` that renders amber is worse than no name at all because it is
 * believed. This is also why there is no `color` prop: a screen picking a hue
 * is a screen deciding what critical looks like.
 *
 * # Two weights, because a category and a state should not blur
 *
 * Outline reads as a classification — a plan name, a region, a kind. Solid
 * reads as a condition — failing, expired, live. A table with two badge
 * columns in the same weight makes the reader work out which is which on every
 * row, and they will get it wrong on the rows that matter.
 *
 * `solid` inverts the existing pair rather than introducing a second palette,
 * so a tone cannot be defined in one weight and missing in the other.
 *
 * # What it is not
 *
 * **Not a button.** No handler, no href, no hover state. A badge that responds
 * to a click is a control that looks like a label, and the affordance is
 * invisible: nothing about a pill says it can be pressed. If it should be
 * pressable it is a `Toggle` (a filter that stays down) or a `Button`.
 *
 * **Not a count.** A number in a pill beside a nav item is a different
 * component with different rules — it needs a live region, a maximum
 * ("99+"), and a spoken form that is not just the digits. Reaching for this
 * one produces a count nobody hears change.
 *
 * **Not sized.** One size. A badge is already the smallest readable text in
 * the system, and the variant that would exist is "smaller", which is the one
 * nobody can read.
 *
 * # Shape
 *
 * Padding rather than a fixed width, so it is as wide as its word — a fixed
 * width clips a long status or pads a short one until it reads as a button.
 * `white-space: nowrap` because it sits inside running text and table cells,
 * and neither should reflow because a status appeared.
 */
export {};
