/**
 * http — the only tier that knows HTTP exists.
 *
 *     http  may import  kernel
 *     http  ✗ solid-js · services · components · routes
 *
 * Above this line the application deals in values. No `Response`, no status
 * number, no `res.json()` and no header name appears in a service, an action or
 * a component.
 *
 * # The port is the seam, and it is a TYPE
 *
 * `port.ts` is the whole of what exists here today. Everything above depends on
 * `HttpClient` and never on something that satisfies it, which is what confines
 * the choice of adapter to one file — and it is why the type is worth having
 * before either adapter does.
 *
 * # Two adapters, one port, and the screen cannot tell
 *
 *     fetch-client   the real transport            NOT WRITTEN
 *     memory-client  fixtures, no network          NOT WRITTEN
 *
 * `lib/root` is the only place that picks. That is what makes running the whole
 * application with no server a supported MODE rather than a stub — see
 * `protocols/fixtures.md`, which states the four properties that keep the two
 * indistinguishable from above, and what each one costs when it is lost.
 *
 * The short version, so it is not lost between here and the day they are
 * written: same error values, non-zero latency by default, falling off the end
 * of the route list is a 404, and the bearer arrives the same way. A fixture
 * more helpful than the server is the wrong kind of wrong.
 *
 * # Why not fetch in each service
 *
 * Every request needs the same six things regardless of which endpoint it hits:
 * base URL resolution, an auth header, a timeout, JSON serialisation,
 * query-string building, and the success/failure decision. None of those is
 * about any one domain. Pushed into the services they become a copy per domain,
 * and changing the timeout policy becomes an edit whose drift is invisible
 * until one endpoint behaves differently under a flaky network.
 *
 * # An envelope module is where the wire keys go, and it does not exist
 *
 * Exactly one file should be permitted to name a wire key, so a change to the
 * error shape is a change to one file rather than a search. It is not written,
 * because it cannot be honestly written without a server to read: the shape,
 * whether the kind is a top-level key or nested, and whether a request id
 * arrives in the body or only in a header are facts about a backend, and
 * inventing them here would produce a decoder that agrees with nothing.
 *
 * `protocols/fixtures.md` puts it as *transcribe; do not invent*. This is the
 * upstream case of the same rule.
 *
 * # Why an error tier throws rather than returns
 *
 * Recorded now because it is cheap now and contested later. A fetch wrapper
 * wants to throw and a form wants a value, so the conversion happens once at a
 * boundary rather than in a catch block per action. A cache library is built
 * around the throw, which is the other reason not to fight it.
 *
 * That is an intention. Nothing here throws yet.
 */
export {};
