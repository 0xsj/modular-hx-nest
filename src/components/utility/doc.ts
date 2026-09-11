/**
 * utility — not components so much as the small mechanisms other components
 * need, and three of the four are decisions about the accessibility tree
 * rather than about pixels.
 *
 * That is the group's shape. Nothing here renders anything a designer would
 * review; each one changes what a reader is told, which is invisible to the
 * review that catches everything else.
 *
 * # The set of icons in use is countable, and now checked
 *
 * `icon.ts` is the only file that may import `lucide-solid`, so the export list
 * is the inventory rather than a guess, and adding one is a visible line in a
 * diff instead of an import buried in a component. That was held by review
 * until this group landed; `utility.test.tsx` now fails on a second importer.
 *
 * # Three ways to name an icon, and AccessibleIcon is the rarest
 *
 *     decorative              aria-hidden="true", written on the icon. No
 *                             component — the design system does this in eight
 *                             places and that is correct.
 *     inside a named control  name the CONTROL. An icon-only button carries
 *                             aria-label; naming the icon as well announces it
 *                             twice.
 *     the icon is the whole   AccessibleIcon. A status glyph in a table cell,
 *     meaning                 where there is no labellable ancestor.
 *
 * The middle row is the mistake that gets made, and it reads as extra care,
 * which is why nobody removes it.
 *
 * The render callback forwards owned attributes to the icon; the child must
 * spread them onto its element to preserve the accessible name.
 *
 * # One implementation of hiding, and it is inline styles
 *
 * There were three before this group: the dialog's hidden title, the avatar's
 * name behind its initials, and the primitive's own. A design system with three
 * copies of visually-hidden CSS has three chances to get it subtly wrong, and
 * the two hand-rolled ones are now deleted.
 *
 * The surviving one sets a frozen style object rather than a class, and that is
 * the right trade here specifically: nothing in the cascade can beat an inline
 * style, and the failure mode of this mechanism — stray text on the screen — is
 * visible to every user at once. The cost is stated on the component: CSS
 * cannot un-hide it, so a skip link is a different thing and is not built.
 *
 * `display: none` and `hidden` are not alternatives. Both remove the text from
 * the accessibility tree, which is the one thing this must not do.
 *
 * # Portal moves DOM placement while preserving Solid ownership
 *
 * Context still reaches the portalled children. Native event paths follow the
 * rendered DOM; Solid delegated events retain their logical portal ancestry.
 * Measured: it renders nothing on the server and nothing on the first client
 * render, so no first-paint or indexable content may live inside one.
 *
 * Reach for it only to escape a clipping or transformed ancestor. Every overlay
 * in this system already portals itself.
 */
export {};
