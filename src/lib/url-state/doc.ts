/**
 * URL state — contract written before implementation.
 *
 * Portable codecs for public, shareable query state. Text, string choices, and
 * bounded positive integers have typed defaults. A schema owns named query
 * keys and infers its state type. It knows no route, router, browser, or framework.
 *
 * Reading never rewrites a URL. Missing keys use defaults without an issue.
 * Duplicate scalar keys and malformed values use that key's default AND return
 * a named issue. Other valid keys are retained. Issue messages never echo raw
 * values. Integers use decimal digits only, are safe integers, and obey bounds;
 * whitespace, signs, decimals, exponents, partial numbers, and zero are invalid.
 * Text is trimmed and length-bounded. Choices match exactly. Defaults and codec
 * configurations must themselves be valid; bad developer configuration throws.
 *
 * Writing validates the full proposed state and returns Result. It removes only
 * owned keys from a copy of the base query, preserves unrelated keys including
 * their repeated values, emits owned keys in declaration order, and omits
 * defaults. It never mutates the base. Invalid writes change no browser state.
 * Updating starts from the latest parsed query, applies a caller-owned updater,
 * then writes; dependent changes such as resetting page belong to that caller.
 * A successful explicit update also normalizes malformed owned parameters.
 * Canonical writes round-trip through read without issues and are idempotent.
 *
 * The Solid router binding observes the current address and uses shallow pushState/replaceState
 * for CLIENT-OWNED state. A committed change pushes by default; normalization
 * replaces. No-op updates add no history entry. Event-time writes merge against
 * window.location.search, preserving pathname and hash and composing rapid
 * updates without a stale rendered snapshot. Browser back/forward drives the same
 * decoded state. Platform write errors return Failure and leave the URL alone.
 * Server-fetched routes may use the same portable schema with router navigation;
 * this client-only binding does not initiate a server refetch.
 *
 * Query values are intentionally visible in history and shared links. Keep
 * credentials, secrets, and private form contents out of this state.
 * Tests are ordinary implementation-visible tests, not a blind spec run.
 */
export {};
