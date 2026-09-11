/**
 * services — one directory per domain, and the only tier that names an endpoint.
 *
 * # A service is plain async TypeScript
 *
 * It takes the client as its FIRST ARGUMENT and never imports one. That single
 * rule is what confines the choice of adapter to `lib/root`, and it is what
 * keeps this tier byte-identical to the sibling templates. The moment a service
 * imports a framework, a router, or a client instance, it has become a binding.
 *
 * # Five things a service does, and nothing else
 *
 *   1. names the endpoint — the only tier permitted to
 *   2. declares what it can fail with: every transport kind, plus the DOMAIN
 *      kinds this operation actually promises
 *   3. narrows, in one line, so the caller's switch is three cases and not ten
 *   4. says whether absence is an answer, for a read where it might be
 *   5. validates, when it can produce the same shape the server would
 *      — input errors are invalid; a malformed success is internal /
 *        invalid_response. Consumed success bodies start as unknown and pass
 *        through a domain response reader, including memory-fixture responses.
 *        Readers explicitly select public fields instead of spreading payloads.
 *
 * It does not fetch, cache, render, decide which adapter to use, or know that a
 * status code exists.
 *
 * # It takes `CallOptions` last, and that is what makes cancellation possible
 *
 * The port has always accepted an `AbortSignal`. For a while no service exposed
 * one, so nothing above the transport could supply it — and the `canceled` kind
 * was defended carefully at every tier while being unreachable from any screen.
 *
 * `CallOptions` is a strict SUBSET of the transport's own options: a caller may
 * cancel or attach an explicit diagnostic trace, and may not set a header, a
 * path or a query. Those belong to the
 * service, which is the only tier permitted to name them. Widening it to the
 * full request options would hand a screen the endpoint back.
 *
 * A composition threads it into every call it makes — a signal honoured by one
 * of two parallel requests is a cancellation that half worked.
 * The same trace goes to both request options and the success decoder, so a
 * transport success does not hide a later contract rejection. Caller-owned
 * operation spans can also capture input validation and final domain outcomes.
 *
 * # `example/` is a specimen and should be deleted
 *
 * A template has no domain. What ships is one worked directory showing the five
 * rules on one small shape, because the rules are subtle and prose does not
 * convey them — a reader wants to see `narrow` used once, and `optional` used
 * once, more than they want another paragraph.
 *
 * Delete it when the first real domain arrives. Nothing in `lib` depends on it;
 * its only callers are the two dev screens, which exist to be replaced.
 *
 * # Why the failure type is an ALIAS per tier and not per function
 *
 * `ReadFailure` and `WriteFailure` are named once and reused. Spelled at each
 * signature they drift, and the drift is invisible: two reads promising slightly
 * different sets is not a compile error anywhere, it is just two callers writing
 * different switches for the same operation.
 */
export {};
