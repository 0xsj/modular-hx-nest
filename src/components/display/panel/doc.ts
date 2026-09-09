/**
 * Panel — a titled region on a surface.
 *
 * # It is a `section` with a name, not a styled div
 *
 * The border and the background are the least of it. What a panel is FOR is
 * saying *these things belong together and here is what they are*, and that is
 * a claim a reader has to be able to hear. A `section` carrying an accessible
 * name is a landmark: it appears in the regions list, it can be jumped to, and
 * its name is announced on entry.
 *
 * So the title is wired with `aria-labelledby` rather than merely drawn, and
 * the attribute is ABSENT when there is no title. A `section` with no
 * accessible name is not a neutral div — it is announced as an unnamed region,
 * which is worse than not being a landmark at all, because it adds an entry to
 * the regions list that tells you nothing about where you have arrived.
 *
 * # The title is an `h2`, and that is a real constraint
 *
 * Heading level is a property of the DOCUMENT, not of the component, and a
 * primitive cannot know its own depth. Two ways out and both cost something:
 * take a level prop, and every caller now has to think about it and most will
 * pass the default; or fix a level and be wrong when panels nest.
 *
 * Fixed at `h2`, because a panel is a top-level region of a screen that has one
 * `h1`, and that is what a panel IS. A panel inside a panel is the case this
 * gets wrong, and it is a smell first: two nested titled regions usually want
 * to be one region containing a list, or two siblings. A caller who genuinely
 * needs another level composes their own header inside a `flush` panel, which
 * is the escape hatch and does not require an API.
 *
 * # `flush` exists because padding belongs to whoever draws the edges
 *
 * A table draws its own row dividers to the edge, a chart bleeds to its
 * bounding box, a list paints full-width hover. Each of them fights a padded
 * parent, and the usual workaround — negative margins on the child — depends
 * on the parent's padding value and breaks silently when it changes.
 *
 * Note where the header's rule sits: on the HEADER, not on the body. If the
 * body owned it, a flush panel would lose the line between its title and its
 * content at the exact moment the content reaches the edges and needs it most.
 *
 * # What it does not do
 *
 * **No elevation, no shadow, no tone variants.** A panel is the flat case, and
 * a raised one is a different component with a different meaning — floating
 * above the page is what an overlay does, and a panel that can look like one is
 * a panel that will be used as one.
 *
 * **No collapsing.** Show/hide is state, and a component that owns it has
 * decided where that state lives. A caller that needs it wraps the panel, or
 * uses `<details>`, which is keyboard-operable and announced for free.
 *
 * **No padding prop.** Two values — padded and not — because the space token is
 * the design decision and exposing it invites a screen to pick a third.
 */
export {};
