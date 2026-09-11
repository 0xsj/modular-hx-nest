/**
 * chaos — force the states a screen has but nobody looks at.
 *
 * # Why this is small
 *
 * The port returns `Result`, so breaking a request is returning a different
 * value. That makes chaos a DECORATOR over `HttpClient` rather than an
 * interceptor: no patched `fetch`, no knowledge of HTTP, and nothing above it
 * changes. It wraps either adapter identically.
 *
 * # Failures are the easy half
 *
 * In development a fixture always has data, so the branches that ship
 * unlooked-at are not only the error ones:
 *
 *     loading      latency, and `hang` for the stuck-spinner case
 *     empty        `ok(null)` and `ok([])` — looked and found nothing
 *     unmeasured   any forced failure — nobody looked
 *     found        the only one anybody ever sees
 *
 * Forcing emptiness is the axis nobody asks for and the one worth most, because
 * `three states, not two` is a rule the fixtures themselves hide.
 *
 * # It is NOT a fixture, and the distinction is load-bearing
 *
 * A fixture reproduces what the server DOES. Chaos forces what it COULD.
 * Collapsing the two would turn `a fixture must reproduce refusals` into `a
 * fixture returns whatever is convenient`, which is the discipline
 * `protocols/fixtures.md` exists to hold. So this never edits a route table.
 *
 * # `hang` is not a timeout, and saying so matters
 *
 * Chaos wraps the client rather than living inside it, so nothing here can trip
 * the transport's own time budget. `hang` produces a promise that never
 * settles — the stuck spinner, a screen with no timeout of its own. For the
 * failure a real elapsed budget produces, use `fail: "timeout"`.
 *
 * It still honours cancellation: an aborted signal resolves as `canceled`,
 * because a hang that ignores abort is a leak rather than a test.
 *
 * # Failures arrive UNNARROWED, which is the point
 *
 * This sits above the transport, so a forced `invalid` on a read is folded to
 * `internal` by that read's own narrowing, carrying the original as its cause.
 * You are watching the real path rather than a simulation of it.
 *
 * # Reproducibility, and why the plan is a link
 *
 * A probabilistic run that cannot be replayed is an anecdote. Every plan takes
 * a seed, and `parsePlan` reads one out of a query string — so a broken state
 * is a URL somebody can send you. A plan configured in code reproduces a state
 * only for the person who edited the file.
 *
 * `parsePlan` is total and silent: a malformed `?chaos=` returns undefined
 * rather than throwing. Chaos that can crash the page is indistinguishable from
 * the bug being hunted.
 *
 * # Safety is structural
 *
 * `withChaos` returns the client untouched when `NODE_ENV` is production — the
 * wrapper is never applied, so reaching a live user takes a deliberate edit to
 * that line rather than a mis-set flag. The composition root should be the only
 * caller, and a surface running under a plan should say so visibly: a forced
 * failure that looks real is an afternoon somebody spends chasing it.
 */
export {};
