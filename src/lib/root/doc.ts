/**
 * root — the composition root, and the only tier that picks an adapter.
 *
 * # It takes what it needs rather than reading it
 *
 * No cookie is read here, no header, no query string. Those are the caller's
 * job, and the caller is the one place that differs per framework — so this
 * tier imports nothing framework-shaped and travels to the sibling templates
 * unchanged, which the boundaries check enforces.
 * Optional diagnostics use the same rule: the caller supplies an explicit trace
 * in CallOptions. Roots wrap transports outside chaos, but do not construct a
 * global recorder, keep interaction history, or choose an export destination.
 *
 * The cost is one line at each call site passing the token and the plan in.
 * The alternative is a tier that reads its runtime's request context and
 * therefore cannot leave that runtime, which is the thing this is for.
 *
 * # One root per INTERACTION, not per request
 *
 * That is what makes the correlation id mean anything. A page that fans out
 * into four service calls should produce four failures naming the SAME
 * interaction; build a root per request instead and the id degenerates into a
 * second request id, and the question it exists to answer — *what else happened
 * when they clicked this* — becomes unanswerable again.
 *
 * # The fixture table ships empty, deliberately
 *
 * A template has no domain, so there is nothing a fixture could honestly
 * reproduce. Every call therefore comes back as an unserved route — `internal`
 * carrying `unserved_route` — which says *this fixture was never asked* rather
 * than pretending a server answered. A caller with its own fixtures passes them
 * in rather than editing this tier.
 *
 * # `usingFixtures` is transport-level PROVENANCE, per domain
 *
 * The one provenance fact a template genuinely owns: did this value come from a
 * fixture or a server? A screen showing fixture data should be able to say so,
 * because *nobody looked* and *a fixture answered* are different claims and a
 * UI that renders them alike has thrown away the difference.
 *
 * Domain provenance — why anyone should believe a value — is not modelled here
 * and should not be. See
 * `decisions/0003-the-client-sends-a-correlation-id-and-provenance-is-a-domain-concern`.
 *
 * # What is deliberately NOT here
 *
 * **Nothing, now.** A per-domain served list was deferred here until domains
 * existed — a `Domain` union with no members being a modelled state with no
 * caller. Three landed, so the deferral expired and `clientFor(domain)` is the
 * result: two questions rather than one, *is there a backend* and *is this
 * domain finished*, so the first endpoint to ship does not wait for the last.
 *
 * `served` defaults to every domain, so a base url on its own does the obvious
 * thing. Naming a subset is the graduation; naming none is a base url
 * configured and deliberately unused.
 *
 * **A session.** Reading and writing a bearer is framework work — a cookie on
 * one runtime, a store on another — and putting it here would cost this tier
 * its portability for no gain.
 */
export {};
