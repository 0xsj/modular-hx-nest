/**
 * Card — the structure of a self-contained item or summary.
 *
 * § CONTRACT
 * Card defaults to an article; `as="div"` supports form choices and non-article
 * content. It has no implicit click, focus, selection, routing, or loading
 * behavior. Header, title, description, body, media, and footer are optional
 * composable parts. The caller chooses every title's heading level and supplies
 * an accessible name when the card is a named region. Media keeps its caller's
 * alternative text. Parts and long content fit their container at narrow widths.
 *
 * CardLink is a real anchor, optionally composed with a router link via asChild.
 * Its hit area extends over the card surface, with one keyboard stop and a
 * visible card focus ring. Use one primary CardLink per card. Secondary controls
 * go inside CardAction or CardFooter, above that hit area, and must remain
 * independently operable. Never put a button inside the primary link. Plain
 * content with selectable text may instead use an ordinary, unstretched link.
 * Unavailable destinations are rendered as plain text, with an explanation.
 *
 * Recipes combine these parts with existing primitives. A record schema,
 * fetching, permissions, navigation decisions, and state remain with the caller.
 *
 * § MECHANICS
 * The primary anchor stretches via a pseudo-element, so a card never needs a
 * click handler or nests other controls inside a link. The card creates a local
 * stacking context; action/footer wrappers sit above the primary hit area.
 * Media has its own positioned frame so a caller's absolutely positioned image
 * fills the media slot rather than the entire card. Parts remain server usable.
 * The body's grid column has a zero minimum: an automatic track lets a nested
 * scrollable table widen the whole body, including unrelated controls. A bounded
 * track keeps horizontal scrolling with the table at narrow viewport widths.
 *
 * § PROVENANCE
 * Contract written before implementation, 2026-09-10. Verification in this pass
 * is implementation-aware; it is not an independent blind spec-test run.
 * Chromium checks on that date covered primary/secondary hit areas, keyboard
 * focus, light/dark themes, both densities, and 320/390/768/1440px layouts.
 * Axe reported no WCAG A/AA violations; sampled card focus contrast exceeded
 * 3:1 in both themes. No assistive-technology testing was performed.
 */
export {};
