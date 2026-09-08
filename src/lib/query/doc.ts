/**
 * query — the cache tier, and why it is separate from `services`.
 *
 *     query  may import  kernel · services · http (the TYPE)
 *     query  ✗ components · routes
 *
 * `services` answers *what does this endpoint return*. This tier answers *when
 * do we ask again, what do we do when it fails, and what else is now stale*.
 * They are different questions and a service that knew the second one would be
 * a service that could not be called from anywhere else.
 *
 * That split is the reason both exist. It is also what keeps `services`
 * byte-identical across the sibling templates: the binding to a cache library
 * lives here, and here is the file that differs.
 *
 * # A cache is a second source of truth, so its defaults are the policy
 *
 * Not a copied snippet. A query cache holds an answer the server gave a while
 * ago, and the settings are where it either keeps agreeing with the server or
 * quietly stops. The three that matter, recorded before anything reads them:
 *
 *     staleTime      not zero, not Infinity. Zero turns a tab switch into a
 *                    burst of requests; Infinity means a finished job still
 *                    reads as running until a reload
 *
 *     retry          never on a refusal. A 403 and a 404 are ANSWERS — asking
 *                    the same question again and hoping for a different answer
 *                    turns one wall into three
 *
 *     mutations      never retried automatically. A write that runs twice has
 *                    done the thing twice
 *
 * # The client is made per browser, never at module scope
 *
 * A module-level client on the server is one cache shared by every request,
 * which is one caller's data served to the next. It works perfectly in
 * development, where one person loads pages one at a time, and that is what
 * makes it dangerous rather than obvious.
 *
 * # What is NOT decided
 *
 * **Whether this tier earns its dependency at all.** `@solidjs/router` ships
 * `query()`, `action()` and `createAsync()`, which overlap with what TanStack
 * does here. In a framework with no client cache of its own the library is
 * unarguable; in this one it is a real question, and the answer chosen was
 * sibling parity — the row reads the same in every template, and the policy
 * above is the transferable part.
 *
 * That reasoning is recorded so it can be overturned deliberately rather than
 * drifted out of. If a screen ends up holding the same answer in both a router
 * query and a TanStack query, this is the note that was wrong.
 *
 * # Empty
 *
 * No client, no provider, no keys. Nothing fetches yet, and a key factory with
 * no query to key is a naming scheme nobody has tested against a real
 * invalidation.
 */
export {};
