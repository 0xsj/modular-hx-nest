/**
 * root — the composition root, and the only file that picks an adapter.
 *
 *     root  may import  everything below it
 *     root  ✗ imported by anything except src/routes
 *
 * Every other tier is written so that this one file is the only place a choice
 * is made. `services` takes the client rather than importing one precisely so
 * that the decision lands here and nowhere else — that is the payoff of the
 * parameter rule, and this is where it is collected.
 *
 * # One decision, and nothing above it changes
 *
 *     an API origin is configured   -> the fetch adapter
 *     absent                        -> the memory adapter over fixtures
 *
 * Nothing above this file differs between the two. That is the property worth
 * verifying rather than asserting, and the way to verify it is to point the
 * build at a real server and watch a screen render its refusal through the same
 * path the fixtures use.
 *
 * # SERVED is a list, not a boolean
 *
 * A backend arrives one endpoint at a time. A single "do we have a server" flag
 * means the FIRST real endpoint breaks every screen depending on the ones still
 * unbuilt — because at that point there is no fallback, by design.
 *
 *     hasServer: boolean     the first real endpoint breaks eleven screens
 *     SERVED: Domain[]       a name moves into the list the day it is served
 *
 * Per-domain, graduating a domain is one line in one place. Print it at startup
 * so the answer to *"is this screen real?"* needs no investigation.
 *
 * **Two questions, not one.** *Is this domain served* is about the backend's
 * progress. *Is this session real* is about who is asking — and a session that
 * is fake in one domain cannot be real in another, because reading fixture data
 * from a live server would 404 and reading real data as a fixture persona would
 * be a disclosure. One prefix on the token carries the distinction.
 *
 * # Why fixtures live here rather than beside the service
 *
 * A fixture is not part of a domain's contract; it is part of this
 * application's configuration. Putting a domain's fixtures inside its service
 * would make the service import a fake — exactly the coupling the port removes
 * — and would put the answer to *"what does this build do without a server"* in
 * every domain instead of one list.
 *
 * # Whether the build is on fixtures is a string a screen renders
 *
 * A build on fixtures says so, on the page. A fake that lies convincingly is
 * how a demo becomes a bug report, and the honest version costs one string.
 *
 * # Empty
 *
 * No adapter, no fixtures, no session. There is nothing to compose: neither
 * adapter exists, no domain exists, and a composition root over an empty set is
 * a file that would have to be rewritten the moment anything real arrived.
 *
 * Everything above is an intention. `protocols/fixtures.md` holds the version
 * that has been paid for.
 */
export {};
