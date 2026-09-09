/**
 * layout — arrangement, and nothing that can be seen.
 *
 * # The group's one rule
 *
 * Nothing here has an appearance. No background, no border, no radius, no
 * colour, no shadow. A `Box` that could be given a background would let a
 * screen restyle a primitive from the outside, which is the thing the cascade
 * tiers exist to prevent — and it would do it invisibly, because the result
 * looks like a `Panel` and is not one.
 *
 * The test for whether something belongs in this group: **could you tell it
 * was there with the stylesheet's colours removed?** If yes it is `display`.
 *
 * `Separator` is the edge case and it stays, because a rule is a position
 * rather than a surface — it says *these are two groups*, which is
 * arrangement, and it carries no tone.
 *
 * # Steps, never lengths
 *
 * Every spacing prop takes a step from `SPACE_STEPS`, so `p={20}` is a compile
 * error and the scale cannot grow a thirteenth value from a call site. `0` is
 * the one literal: there is no `--space-0` token and there should not be,
 * because zero is not a size.
 *
 * The alternative — `p="12px"` — is the same thing as writing the CSS, except
 * it is now spread across the components that happen to use it and cannot be
 * changed in one place.
 *
 * # There is no `pl` or `pr`, and that is the point
 *
 * The props are `ps`/`pe` — inline START and END — because every stylesheet in
 * this template is written in logical properties. A `pl` that means "left"
 * becomes a lie the first time the app renders in Arabic or Hebrew, and it is
 * a lie nothing detects: the layout is merely mirrored wrongly, which reads as
 * a design that was never checked.
 *
 * `pt`/`pb` are kept for the block axis because top and bottom do not flip in
 * any writing mode this template supports, and `pbs`/`pbe` would be cryptic
 * for no gain.
 *
 * # Order is load-bearing
 *
 * The style object is built broadest-first — `padding`, then `padding-inline`,
 * then the individual sides — because a style object is applied in insertion
 * order. Reversed, `p={4} pt={0}` would apply the 4 after the 0 and silently
 * ignore the override. `SPACE_KEYS` is therefore written out by hand rather
 * than derived from the property map with `Object.keys`, which is a guarantee
 * about an object and not about intent.
 *
 * # `spaceStyle` is called inside the `style` prop
 *
 * Not above the return. That position is tracked, so a step that changes
 * updates the declaration; computing it once in the component body reads the
 * props outside any computation and freezes them at their first values. This
 * is the same trap the field wrapper hit from the other direction, and the
 * same reason `splitSpace` returns the framework's proxies rather than a copy.
 *
 * # Why `asChild` on Box and Flex, and not on Container
 *
 * A Box exists to carry spacing onto something. If it cannot become the thing,
 * it has to wrap it, and a wrapper changes the layout it was brought in to
 * describe — a flex child gains a box between it and its parent, and the
 * arrangement that was correct stops being correct.
 *
 * A Container is different: it centres and caps, which needs an element of its
 * own by definition. There is nothing for it to become.
 *
 * # What this group does NOT have
 *
 * **No Grid.** A grid's value is in `grid-template-areas` and named lines, and
 * every prop-based API for it either exposes a string that is CSS with extra
 * steps, or covers the trivial cases only. Grids belong in the screen's own
 * stylesheet, in `@layer composition`.
 *
 * **No Stack.** `Flex` with `direction="column"` and a `gap` is the same
 * component, and a second name for it splits every future decision in two.
 *
 * **No Spacer.** An element that exists to push things apart is a margin that
 * has been given a DOM node, and it lands in the accessibility tree.
 */
export {};
