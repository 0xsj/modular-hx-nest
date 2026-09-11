/**
 * layout — arrangement, and the smallest set of it that is worth owning.
 *
 * # Why this group exists at all, having argued it should not
 *
 * The position this group shipped with was that arrangement is a screen's own
 * business and a layout library is how a design system starts owning decisions
 * it cannot see. That is still true of layout COMPONENTS — a `<Stack>` with
 * eleven props is a stylesheet with worse ergonomics.
 *
 * What changed is the mechanism. These four take spacing as props that resolve
 * to the EXISTING tokens and emit an inline style, so they add nothing to the
 * cascade and invent no second scale. See
 * `decisions/0004-spacing-shorthand-is-a-typed-accessor-to-the-token-scale`.
 *
 * # Spacing and flow only
 *
 * No colour, no type, no borders, no radii. A prop for those would let a screen
 * restyle a primitive from the outside, which is precisely what the layer model
 * exists to prevent — and it is the line between a typed accessor to the tokens
 * and a utility framework.
 *
 * # The edge shorthands are logical
 *
 * `pl` is inline-start, not left. The familiar letters are kept because in a
 * left-to-right document they are the same thing; in a right-to-left one the
 * padding follows the text rather than staying on the west side of the screen.
 * Physical names would be a lie that only surfaces in a language nobody on the
 * team reads.
 *
 * # `Flex grow` sets `min-inline-size: 0`
 *
 * A flex child defaults to `min-width: auto`, which refuses to shrink below its
 * content and overflows the row. It is the commonest flex defect, it is not the
 * caller's fault, and a component that takes `grow` should not hand it back.
 *
 * # `Container` is the one arrangement decision made on a screen's behalf
 *
 * Because a reading measure is a typographic fact rather than an arrangement —
 * capped in characters, not pixels, since that is what legibility depends on.
 */
export {};
