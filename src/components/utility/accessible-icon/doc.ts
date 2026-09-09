/**
 * AccessibleIcon — an icon that carries meaning, given the words it stands for.
 *
 * # Most icons should NOT use this
 *
 * The default for an icon is `aria-hidden`, and it is the right default. An
 * icon beside a label — a plus next to "Add camera", a chevron on a select —
 * is decoration: the text has already said it, and announcing both means
 * hearing it twice.
 *
 * This component is for the minority where the glyph is the ONLY carrier:
 * a status dot in a table cell, a lock in a row of otherwise plain rows, a
 * trend arrow. Reach for it when removing the icon would remove information.
 *
 * The question to ask: **if the icon were deleted, would anything be lost?**
 * No — hide it. Yes — it needs words, and they go here.
 *
 * # The label is what it MEANS, not what it depicts
 *
 *     "triangle with an exclamation mark"     what it looks like
 *     "Degraded"                              what it means
 *
 * The second is the only useful one. A reader does not need the picture
 * described; they need the fact the picture stands for. This is the same
 * mistake as alt text that says "photo of".
 *
 * # Why hidden glyph plus hidden text, rather than a label on the svg
 *
 * Two reasons, both about how the name is computed:
 *
 * An `aria-label` on an element with no role is ignored by some assistive
 * technology — labels attach to things that have a role to be labelled.
 * Adding `role="img"` fixes that and creates the second problem: an inline
 * icon mid-sentence becomes a separate object in the tree, announced as its
 * own image, which interrupts the sentence it was part of.
 *
 * Hiding the glyph and putting real text beside it keeps the words in the
 * reading order they belong to, and works everywhere.
 *
 * `display: contents` on the wrapper so it disappears from layout — the icon
 * keeps whatever box its parent gave it.
 *
 * # Related, and easy to confuse
 *
 * `VisuallyHidden` is the general primitive; this is the specific pairing of
 * it with a hidden glyph. An icon-only BUTTON is different again: the name
 * belongs on the button, not on the icon inside it, which is why
 * `forms/button` demands `aria-label` on its icon branch as a type error.
 */
export {};
