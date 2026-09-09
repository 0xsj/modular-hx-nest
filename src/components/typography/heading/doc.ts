/**
 * Heading — the document's outline, and its appearance, as two separate props.
 *
 * # `level` and `size` are not the same decision
 *
 * This is the entire reason the component exists.
 *
 *     level   WHERE this sits in the document. h1…h6. Structure
 *     size    how big it looks. Appearance
 *
 * With one prop they are forced together, and every design eventually needs
 * them apart: a card title that is the third level of the page and should look
 * small; a hero that is the only h1 and should look enormous; a sidebar
 * section that is an h2 in the outline and 12px on the screen.
 *
 * The usual workaround is to pick the tag that LOOKS right, and the result is
 * a document whose outline is a description of the type scale. A reader
 * navigating by headings — which is how a screen reader user finds anything on
 * a long page — gets a structure that does not match the content.
 *
 * # `level` has no default, deliberately
 *
 * Defaulting it to `2` would make the common case shorter and the failure
 * silent: a page with no `h1`, or one that skips from `h1` to `h3`, looks
 * completely normal. Requiring the prop makes the author state the position,
 * once, at the only moment they know it.
 *
 * The rules the caller is being asked to think about:
 *
 *     one h1 per page, and it names the page
 *     never skip a level going down — h2 then h4 is a gap a reader falls into
 *     coming back UP is fine — h4 then h2 starts a new section
 *
 * # `text-wrap: balance`
 *
 * Headings are short enough for the browser to balance line lengths, and it
 * prevents the single trailing word that makes a two-line heading look broken.
 * It is deliberately not on body text, where the cost is real and the benefit
 * disappears past a few lines.
 *
 * # What it does not do
 *
 * **No margin.** Spacing between a heading and what follows is a property of
 * the LAYOUT, not of the heading — the same heading needs different space in a
 * card, a page, and a dialog. Margin here is what forces `margin-top: 0`
 * overrides three tiers up.
 *
 * **No `as` escape hatch.** `level` already picks the tag, and a second way to
 * do it would let a caller render an `h2` at `level={3}`, which is the exact
 * mismatch this design prevents. A visually-styled non-heading is `Text`.
 *
 * **No anchor link.** A self-linking heading needs an id strategy, a slug, and
 * a copy affordance; it belongs to the screen that wants it.
 */
export {};
