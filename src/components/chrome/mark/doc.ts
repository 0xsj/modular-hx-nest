/**
 * Mark — the product's name, in one place.
 *
 * # The name is a constant, and that is the feature
 *
 * `PRODUCT_NAME` is exported and used as the default. Renaming the product is
 * this line, and a template that scattered the name across a header, a title,
 * an empty state and a footer would make the rename a search — which always
 * misses one.
 *
 * # A link needs to say where it goes
 *
 * When `href` is given the mark becomes a link, and its accessible name
 * becomes "<name>, home" rather than just the name. A link announced as
 * "Flover" is a link to a word; the convention that a logo goes home is
 * learned by sighted users from POSITION, which is not available to a reader.
 *
 * The glyph beside the wordmark is `aria-hidden` for the usual reason: the
 * word is the name, and announcing both says it twice.
 *
 * # The glyph is drawn from tokens, not shipped as a file
 *
 * A template has no logo to ship, and a placeholder image file is one more
 * thing to find and replace. A square drawn from the accent token is honest
 * about being a placeholder and disappears the moment somebody puts their own
 * mark in — which is the intended edit.
 *
 * # `activeClass` is emptied
 *
 * The router's link component defaults to the GLOBAL class names "active" and
 * "inactive". A mark linking to `/` would carry one on every page, and `/`
 * normalises to the empty string so the prefix match is true everywhere —
 * hence `end` as well. See `navigation/nav-link/doc.ts`, where the same two
 * traps are set out in full.
 */
export {};
