/**
 * User manual contract — declared before implementation.
 *
 * Public cookbook reference, available without authentication. An overview and
 * stable chapter routes explain the implemented architecture: ownership and
 * import boundaries, Result/Failure semantics, feature construction, backend
 * adaptation, state/recovery and verification. Unknown chapters are not-found.
 * Chapter navigation marks the current page; section anchors and previous/next
 * links work with browser history and narrow screens. Code/tables scroll within
 * named keyboard-reachable regions, never widen the page.
 *
 * One authored content model drives HTML and a complete downloadable Markdown
 * manual. The download performs no filesystem reads and includes only authored
 * guide content. Repository paths are source references, not broken HTTP links.
 * A repository index links those files for readers outside the running app.
 * Optional protocols remain optional: the app does not import their contents.
 *
 * Examples name real APIs; excerpts identify their source or intended placement.
 * Explain actual limitations, including isolated cookbook roots, semantic backend
 * guarantees, the existing /auth/me forbidden policy, Result serialization and
 * server-error redaction. Do not claim unique invention, universal backend
 * compatibility, production readiness or blind-test provenance from green tests.
 * This addition documents behavior; it changes no authentication or data policy.
 */
export {};
