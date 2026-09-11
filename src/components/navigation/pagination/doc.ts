/**
 * Pagination — a controlled position in a known number of pages.
 *
 * § CONTRACT
 * Pages are one-based. The current page is announced; previous/next are
 * disabled at their respective boundaries. First, last, and nearby pages stay
 * reachable, with noninteractive ellipses for gaps. One page or zero pages
 * renders no navigation. The caller changes the data and owns the page value.
 * Native buttons make this suitable for in-place collections. Route pagination
 * should use links composed by its routing tier instead.
 *
 * § MECHANICS
 * A small pure page-window function feeds buttons. It knows no query library,
 * URL, row count, or request lifecycle.
 */
export {};
