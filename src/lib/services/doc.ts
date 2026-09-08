/**
 * services — one directory per domain, and no framework anywhere in it.
 *
 *     services  may import  kernel · http (the TYPE only)
 *     services  ✗ solid-js · components · routes · root
 *
 * A service is a set of plain async functions that take an `HttpClient` and
 * return a promise. It does not create a client, does not read configuration,
 * and does not know whether it is talking to a server or to fixtures.
 *
 * # Why the client is a parameter and not an import
 *
 * The moment a service imports a concrete client, the choice of adapter is made
 * in every service instead of one place, and running the application on
 * fixtures stops being a mode and becomes a code change. Passing it in also
 * means a function can be called with a stub in a test without a module mock.
 *
 * **This single rule is what makes the tier portable.** A service that imports
 * `solid-js` has become a binding, and the three sibling templates then have
 * three service tiers instead of one. `protocols/enforcement.md` calls this the
 * load-bearing rule in a multi-framework series and gives it a check:
 *
 *     { "from": "lib/services/**", "deny": ["solid-js"],
 *       "message": "a service is plain async code — importing the framework
 *                   makes it a binding (S7)" }
 *
 * No runner exists, so that check is currently a preference. Naming it here is
 * not the same as enforcing it, and the difference is the whole point of that
 * protocol.
 *
 * # Nothing above this tier names a URL, a status code or a header
 *
 * This is the only tier that names an endpoint. That is what makes it the
 * boundary worth guarding: a screen that knows a path has taken a dependency on
 * the backend's routing, and it will be the thing that breaks when the route
 * moves.
 *
 * # The types are the wire shape, in the wire's spelling
 *
 * Whatever casing the server sends is the casing used here. A rename at this
 * tier is a second vocabulary to keep in step, and it drifts. If that ever
 * becomes intolerable, the translation belongs in one mapping function per
 * domain, not spread through components.
 *
 * Optional, not nullable. Absent means the fact is not there — and absent and
 * "set to nothing" are different facts, which is the rule the whole tier model
 * runs on.
 *
 * # Empty, and deliberately so
 *
 * There are no domains, because there is no server and no screen. A domain
 * directory invented now would model an endpoint nobody has served and a shape
 * nobody has sent, and every screen built against it would be built against a
 * contract nobody keeps.
 *
 * A domain arrives with the first caller that needs it.
 */
export {};
