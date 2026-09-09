/**
 * Empty — looked, and found nothing.
 *
 * # It is one of three states and must not be used for the others
 *
 *     nobody looked        a failure. It has its own rendering, and it says
 *                          what went wrong and what to do about it
 *     looked, found none   THIS
 *     looked, found some   the content
 *
 * The reason this is a component rather than a paragraph is that the middle
 * row keeps being used for the first. A request fails, the list is `[]`, and
 * the screen says "No cameras yet" about a fleet of two hundred. The user is
 * now confidently misinformed, which is worse than an error, because an error
 * invites a retry and this invites acceptance.
 *
 * `lib/kernel`'s `optional` is where that distinction is made, and this
 * component is the render half of it. If the value reaching here came from a
 * `catch` that returned `[]`, the bug is already upstream and no amount of
 * copy fixes it.
 *
 * # The title uses the product's nouns
 *
 * "No cameras yet" tells you what is missing and implies where you are. "No
 * data" tells you that a container is empty, which the blank space had already
 * conveyed, and is the same sentence on every screen — so a person who lands
 * on the wrong one has no way to notice.
 *
 * The type takes a `string` rather than a node for exactly this reason: it is
 * a sentence somebody writes, not a slot to compose.
 *
 * # `action` is optional because sometimes there is nothing to do
 *
 * An empty state with a button is the good case: the absence is fixable and
 * here is the fix. But a filtered list that matched nothing, or a feed with no
 * events today, has no action — and inventing one ("Refresh") gives the user a
 * thing to press that changes nothing, which is worse than a plain sentence.
 *
 * The component therefore does not require it and does not supply a default.
 *
 * # Shape
 *
 * Capped at a reading measure and centred. A single sentence stretched across
 * a wide panel is read as a heading rather than as prose, and the eye has no
 * idea where to land. The cap is in `ch` because legibility depends on
 * characters per line, not on pixels.
 *
 * No illustration slot. An empty state is a sentence; a component that expects
 * artwork gets artwork nobody has, and the placeholder ships.
 */
export {};
