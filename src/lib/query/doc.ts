/**
 * query — the async cache, and the only place a value becomes a throw.
 *
 * # Not portable, and that is correct
 *
 * This is the one tier below the screens that binds to a framework: the sibling
 * templates use the React and Svelte adapters of the same library. The SHAPE
 * ports — one throw site, keys in one file, the retry policy asking the kernel —
 * and the files do not. It is therefore excluded from the copy-verbatim set.
 *
 * # The retry policy asks the kernel, and never a status code
 *
 * `retryDelay` returns a delay or null. Null for anything that is an ANSWER
 * rather than a fault — a refusal, a validation failure, a cancellation. A
 * delay the server itself chose, when it sent a retry-after.
 *
 * The project this was extracted from states that rule in a comment and then
 * compares `error.status` to 400 and 500 in the function below it. One
 * definition, in the kernel, consulted here.
 *
 * # Why `queryOptions` rather than a bare key and function
 *
 * It keeps the two together, so a caller cannot pair the wrong key with the
 * wrong fetcher — which is the failure that presents as a screen refusing to
 * update after a mutation, and reads as a stale server rather than a typo.
 *
 * # `unwrap` is the boundary, and it is deliberately ugly
 *
 * Everything below returns a Result. The cache wants a rejected promise. So one
 * function converts, here, and every tier below stays free of invisible control
 * flow. `asFailure` on the way back turns the thrown thing into the same value
 * the rest of the system speaks, so one exhaustive switch serves both paths.
 *
 * # A mutation cancels before it is optimistic
 *
 * A refetch already in flight resolves with a list that still holds the row the
 * mutation is removing, and it lands AFTER the optimistic update — so the row
 * reappears for a frame and then goes again. `cancelQueries` first is what makes
 * the optimism hold, and it is a second reason the port has always accepted a
 * signal.
 *
 * The rollback is decided by the failure KIND, not by the fact of failure. A
 * `not_found` on a delete means the row had already gone: the removal was right,
 * and putting it back shows a dead row and reports a failure that did not
 * happen.
 *
 * # What is deliberately absent
 *
 * Session writes use server actions so HttpOnly cookies remain server-owned
 * and ordinary form submission works. Cache-backed resource writes use query
 * mutations; portable durable-write models keep their own explicit state.
 *
 * # Browser queries and hydration
 *
 * Browser-owned reads begin after mount. A disabled TanStack query can still
 * suspend when its data resource is read, so clientData also defers that read
 * until the server shell has hydrated. Query policy, cancellation and error
 * handling stay in the same cache; no server data is silently replaced by empty
 * success. Server prefetching can be added as a separate explicit binding.
 *
 * # Live events invalidate data, not component identity
 *
 * `useLiveQueries` binds a portable EventSource to caller-selected key prefixes.
 * Events in one short window coalesce; connection open resyncs declared keys
 * because notifications could have been missed. `LiveQueryBridge` mounts the
 * same behavior without a status UI. Source, mapping, and resync list identities
 * define the subscription lifetime; pass stable values. Cleanup cancels pending
 * invalidation timers and unsubscribes. Query failure and connection state are
 * separate: the consumer can retain last successful data through either failure.
 */
export {};
