/**
 * Avatar — a person, at a glance.
 *
 * # `name` is required, and that is the whole design
 *
 * An avatar identifies somebody. An image alone cannot do that: it fails to
 * load, it is absent for most users of most systems, and it says nothing at
 * all to a reader. So the name is the input and the image is an enhancement of
 * it, which inverts the shape people reach for — `src` with an optional
 * `alt` — and makes the broken case unrepresentable rather than merely
 * discouraged.
 *
 * Three consequences fall out of that one decision:
 *
 *     no src            initials, from the name
 *     src that fails    initials, from the name
 *     no name           a compile error
 *
 * The middle row is the one worth having. A broken `src` otherwise renders the
 * browser's broken-image glyph, which says *this page is broken* about a
 * person — so `onError` swaps to the fallback rather than letting it show.
 *
 * # One label, not three fragments
 *
 * The wrapper takes `role="img"` and `aria-label={name}`, and everything
 * inside is hidden. Without that the initials are announced as loose letters —
 * "J D" — and the image contributes a second copy of a name that is usually
 * already in the text beside it. The component is one object in the
 * accessibility tree because it is one object on the screen.
 *
 * `alt=""` on the image is therefore correct rather than lazy: the name is on
 * the wrapper, and repeating it would have a reader say it twice.
 *
 * # Initials take the first and last word
 *
 * Not the first two, and not every word. "Ada Byron King" gives AK, which is
 * what a person expects, and "Ada" gives A rather than crashing on an index
 * that is not there. Sliced by CODE POINT, so a name beginning with an astral
 * character or an emoji yields that character instead of half a surrogate pair
 * rendered as a replacement box.
 *
 * This is a heuristic and it is wrong for some names — patronymics, particles
 * like "van", scripts where the family name comes first. It is wrong
 * *legibly*, which is the requirement: the accessible name is always the full
 * name, so nothing is lost when the initials are odd. A caller who needs exact
 * initials for a name we get wrong can pass an image, or the group can grow an
 * `initials` override the day a real case turns up — not before.
 *
 * # What it does not do
 *
 * **No status dot.** Presence is a second, live fact about a person and it
 * needs its own announcement; hanging it off this component gives it a
 * position and no voice.
 *
 * **No stack or group.** Overlapping avatars with a "+3" is a different
 * component with its own truncation and naming rules, and building it into
 * this one would put a list's concerns inside a single item.
 *
 * **Two sizes.** Both are token-driven and neither is configurable, because a
 * third size is a layout asking for a different component.
 */
export {};
