/**
 * VisuallyHidden — text for readers, absent from the screen.
 *
 * # Every simpler way of hiding is wrong
 *
 *     display: none        removed from the accessibility tree
 *     visibility: hidden   removed from the accessibility tree
 *     hidden attribute     removed from the accessibility tree
 *     opacity: 0           still occupies its box, still hit-tested
 *     text-indent: -9999px breaks in right-to-left, and scrolls there
 *     font-size: 0         inherited by children, and some readers skip it
 *
 * The first three are the intuitive ones and they do the exact opposite of
 * what is wanted: they hide the text from the only audience it has.
 *
 * What is left is to render the text normally and clip its box to nothing.
 * Both `clip` and `clip-path` are set — `clip` is deprecated but is the one
 * older assistive technology honours, and dropping it silently loses the
 * oldest readers, which are disproportionately the ones in use.
 *
 * `white-space: nowrap` is the line people leave out. Without it the text
 * still wraps inside a 1px-wide box, and some readers announce the result one
 * word per line.
 *
 * # It is not a focus-visible variant
 *
 * A skip link needs to APPEAR when focused, and that is a different component:
 * it needs a `:focus-within` escape from the clip and a real position on the
 * page. Making this one do both would mean every hidden label carries layout
 * rules for a state it never enters.
 *
 * # Use it for the second channel, not for a first one
 *
 * The legitimate use is text that duplicates something already conveyed
 * visually by a shape a reader cannot see — the word "not measured" beside an
 * em-dash, a unit beside a glyph. Text that appears ONLY here is a fact the
 * sighted user does not get, and that asymmetry is a bug in the design rather
 * than a use for this component.
 */
export {};
