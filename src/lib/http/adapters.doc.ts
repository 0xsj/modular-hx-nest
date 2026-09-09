/**
 * The two adapters — one port, two implementations, and the property that a
 * caller cannot tell which one answered.
 *
 * An oracle under `flover-solid ADR 0001`; written before `fetch-client.ts`
 * and `memory-client.ts` existed. §5 is normative and numbered.
 *
 * One document for both, because the claim worth the most here is a claim
 * about the PAIR. Specified separately, "indistinguishable from above" has
 * nowhere to live and becomes a sentence nobody can check.
 *
 *
 * # 1 · What an adapter owes
 *
 * It satisfies `HttpClient` and it never throws. Every exit is a `Result` —
 * a refusal, a dropped socket, a cancellation, a body that will not parse, a
 * route nobody registered. `flover-solid ADR 0003` decided that; here it
 * becomes a property two implementations have to hold identically.
 *
 *
 * # 2 · The timeout must not be hand-rolled
 *
 * Measured under this runtime on 2026-09-09:
 *
 *     controller.abort()                        -> AbortError
 *     AbortSignal.timeout(ms)                   -> TimeoutError
 *     AbortSignal.any([timeout, callerSignal])  -> TimeoutError, when the
 *                                                  timeout is what fired
 *
 * A timeout built from a controller aborted by hand is therefore
 * indistinguishable from the caller's own cancellation — and a cancellation is
 * never retried, because the caller asked for it. A hand-rolled timeout would
 * make every timeout permanently non-retryable, silently, with a correct-looking
 * `canceled` on the screen.
 *
 * The caller's signal is COMBINED with the timeout, never replaced. A caller
 * that passes a signal has not given up its right to a timeout, and a client
 * that dropped the timeout on that branch would hang forever on the one
 * request somebody was already watching.
 *
 *
 * # 3 · A body that will not parse on a 2xx is OUR problem
 *
 * It is decoded outside the transport `catch`, deliberately. Folded in, a
 * contract break would be classified `unavailable` — which is retryable — so
 * the client would hammer an endpoint that is answering perfectly well with
 * the wrong shape. It is `internal`: nobody's network failed, the agreement
 * did.
 *
 *
 * # 4 · An unserved fixture route is not a 404
 *
 * **This departs from `protocols/fixtures.md` §3, which says falling off the
 * end of the route list is a 404 "exactly as it would be". The departure is
 * deliberate and the reason is recorded here rather than left as a silent
 * disagreement.**
 *
 * That rule conflates two different facts:
 *
 *     the SERVER does not serve this path      a 404 is the truth, and a
 *                                              fixture reproduces it by
 *                                              registering a route that
 *                                              returns one
 *
 *     the FIXTURE was never written for a      the fixture is incomplete.
 *     path the server does serve               Calling that a 404 invents a
 *                                              server answer nobody gave
 *
 * The protocol's own principle decides it. *A fixture more helpful than the
 * server is the wrong kind of wrong* has a mirror: a fixture that INVENTS a
 * server answer is wrong in the same way, and this is the invention that hurts
 * most — `failure.doc.ts` §3 shows it ending as a screen reporting *looked and
 * found nothing* about an endpoint nobody ever built.
 *
 * Two thirds of the protocol's clause survive and are kept: falling off the end
 * is **not a crash** and **not an empty success**. It is a loud, distinct
 * failure that names itself as the fixture's rather than the server's. A screen
 * that wants to exercise a 404 registers a route that returns one — which it
 * had to do anyway to choose the message.
 *
 *
 * # 5 · CONTRACT
 *
 * ## Both adapters
 *
 *   A1  Both satisfy `HttpClient`: `request`, and `get`/`post`/`put`/`patch`/
 *       `delete` delegating to it with the matching method.
 *
 *   A2  Neither ever throws or rejects. Every outcome is a resolved `Result` —
 *       including a malformed body, a transport error, a cancellation, and a
 *       path no route matches.
 *
 * ## The fetch adapter
 *
 *   A3  The request URL is `baseUrl` with trailing slashes removed, then the
 *       path APPENDED. A mount path in `baseUrl` survives — resolving the path
 *       against the base instead would discard it.
 *
 *   A4  `params` entries whose value is `undefined` are omitted. Every other
 *       value is stringified.
 *
 *   A5  The timeout is `AbortSignal.timeout`, and the caller's signal is
 *       combined with it rather than replacing it. `options.timeoutMs` wins
 *       over `config.timeoutMs`, which wins over the default.
 *
 *   A6  `content-type: application/json` is sent when, and only when, a body
 *       is being sent.
 *
 *   A7  An `authorization` header is sent when, and only when, the configured
 *       accessor returns a non-empty token.
 *
 *   A8  The correlation header is sent when, and only when, the configured
 *       accessor returns a non-empty id.
 *
 *   A9  Caller-supplied `headers` are applied last and win over the headers
 *       above. A caller stating a header explicitly has said what it means.
 *
 *   A10 A non-2xx is passed to `config.decodeFailure` when supplied, and to
 *       the envelope's decoder otherwise, and returned as `Err`.
 *
 *   A11 A 204 is `Ok` with an undefined value. No parse is attempted.
 *
 *   A12 A 2xx whose body will not parse is `Err` of `internal` — never
 *       `unavailable`. See §3.
 *
 *   A13 A throw from `fetch` itself becomes `Err` of the transport
 *       classification for that thrown value.
 *
 * ## The memory adapter
 *
 *   A14 Latency is non-zero by default and configurable. A zero-latency fake
 *       makes every pending branch unreachable, and unreachable branches rot.
 *
 *   A15 Routes are tried in order. The first whose method and pattern both
 *       match handles the request; the rest are not consulted.
 *
 *   A16 A route receives the method, path, params, body, the bearer token as
 *       the client would have sent it, and the correlation id. A fixture that
 *       cannot see what a caller sent cannot reproduce a server that reads it.
 *
 *   A17 A caller signal that is already aborted yields `Err` of `canceled`,
 *       without consulting any route.
 *
 *   A18 NO ROUTE MATCHING yields `Err` of `internal`, carrying a `type` that
 *       identifies it as an unserved route. Never `not_found`. See §4.
 *
 *   A19 A route's own `Result` is returned unchanged, apart from A20.
 *
 * ## The pair
 *
 *   A20 Correlation is attached identically by both. What the answer already
 *       carries wins; otherwise the id the client would have sent is attached;
 *       if there is no id, nothing changes. A successful result is never
 *       modified.
 *
 *   A21 INDISTINGUISHABLE FROM ABOVE. For a given refusal, the failure a
 *       fixture route returns and the failure decoded from the equivalent
 *       response agree on `kind`, on `message`, and on the presence of the
 *       per-kind payload. A caller branching on `kind` cannot tell which
 *       adapter answered.
 *
 *       This is the clause the pair exists for, and the only one that cannot
 *       be checked by testing either adapter alone.
 *
 *
 * # 6 · Deliberately absent
 *
 * **Retries.** Nothing here retries. `isRetryable` classifies; scheduling is
 * policy and belongs where a retry would actually be issued.
 *
 * **A response cache.** That is the async-state tier's job, not the
 * transport's.
 *
 * **A decoder seam on the memory adapter.** It never decodes a `Response` —
 * its routes return failures directly, so there is nothing for a decoder to
 * do. The asymmetry is the shape of the problem rather than an oversight.
 *
 * **Route registration helpers.** What a fixture route looks like beyond its
 * signature is the fixture set's business, and there are no fixtures.
 *
 *
 * # 7 · Testing this tier needs the runtime's own fetch
 *
 * Not a note about tooling — a consequence of §2, and it decides whether A5 is
 * checkable at all.
 *
 * Measured 2026-09-09: under the simulated DOM this project tests in, BOTH a
 * hand-rolled abort and an `AbortSignal.timeout` report `NetworkError`. The
 * distinction A5 exists to protect does not survive that environment, so a
 * test written there passes whether the timeout is hand-rolled or not.
 *
 * A stubbed `fetch` does not rescue it either: a stub resolves before any
 * timeout can fire, so nothing exercises the branch.
 *
 * A test for A5 therefore has to run against the RUNTIME's fetch, with a
 * server that accepts and never answers — `// @vitest-environment node` at the
 * top of the file. Everything else in this contract is checkable with a stub.
 *
 * Recorded here rather than in a test file because it is a property of the
 * contract's verifiability: a clause whose only honest test needs a different
 * environment is a clause that will otherwise be tested wrongly and pass.
 *
 *
 * # 8 · What this specification does NOT decide
 *
 *   - The default timeout and the default latency, beyond A5 and A14.
 *   - The `type` string A18 uses, only that one identifies the case.
 *   - What a route does with the token; A16 only requires that it can see it.
 *   - Whether a fixture session and a real session may be mixed. That is
 *     `lib/root`'s question.
 *   - Anything about a 2xx body's SHAPE. The adapter parses; validating is a
 *     service's business.
 */
export {};
