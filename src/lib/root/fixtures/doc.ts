/**
 * fixtures — what this build answers with when no server is configured.
 *
 * One file per domain, each exporting a route list, all concatenated by
 * `index.ts` in order. Order is priority: the first route matching a method and
 * a path answers, so a specific route placed before a general one wins.
 *
 * # A fixture reproduces the server's REFUSALS, not only its happy path
 *
 * A route may answer with a value or with a failure, and the failures are the
 * point. A screen is hard to get right against a refusal and easy to get right
 * against a success, so a fixture set that only ever succeeds tests the half
 * that was never in doubt — and produces a build that is easier to satisfy than
 * the server it stands in for.
 *
 * # A route that is not registered is not a 404
 *
 * The transport answers an unregistered route with an internal failure naming
 * the condition, deliberately rather than with `not_found`. That is a property
 * of `lib/http` and the reasoning is recorded there; what matters here is the
 * consequence: **a screen that wants to exercise a real 404 must register a
 * route that returns one.** Deleting a route does not simulate absence, it
 * simulates a missing fixture.
 *
 * # There is one route, and it is not a domain
 *
 * `health` exists because the transport needs to be reachable before any
 * product exists, and because a template that ships no fixtures cannot
 * demonstrate that memory mode works at all. It is infrastructure, not
 * vocabulary. Domains are added by whoever clones this.
 */
export {};
