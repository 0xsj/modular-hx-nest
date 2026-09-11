/**
 * http — the transport PORT and its two adapters. The only tier that knows HTTP.
 *
 * # The port returns `Result`, and that is the load-bearing choice
 *
 * An HTTP call failing is routine, not exceptional, so it belongs in the type.
 * Three things follow, and the third is the one that matters most:
 *
 *   · a service is a one-liner — there is no try/catch wrapper per call
 *   · the memory adapter reproduces the server's REFUSALS by returning them,
 *     which is what a fixture is actually for
 *   · nothing below the framework edge throws, so there is exactly one place in the
 *     tree where control flow becomes invisible
 *
 * `lib/root` remains the only file that picks an implementation.
 *
 * Successful JSON is still unknown data. Services apply response readers after
 * either adapter answers; see response.doc.ts. Readers validate and project
 * domain DTOs, and can map a different backend's success envelope. Malformed
 * success bodies are internal / invalid_response, not user input errors.
 *
 * Optional CallOptions.trace is an explicit observation scope. withDiagnostics
 * records transport outcomes without inspecting addresses or payloads; response
 * decoders record their own stage. Roots put the decorator outside fault
 * injection, so simulated transport failures are visible too. No trace means
 * no recording, and a broken recorder cannot change the request's Result.
 *
 * # `envelope.ts` is the only file that may name a wire key, a header or a status
 *
 * Everything above it sees only `Failure`. That is what makes a closed union
 * safe against a server nobody here controls: `failureFromResponse` is TOTAL —
 * every response becomes exactly one failure, it never throws on a malformed
 * body, and an unrecognised server `kind` is preserved in `type` rather than
 * discarded. The client is never wrong at runtime, only less specific, and
 * adding a kind later is a deliberate act that lights up every `switch`.
 *
 * `ClientConfig.decodeFailure` replaces the decoder wholesale for a backend
 * that speaks differently, so a product never edits this tier to adopt the
 * template. The default also reads `detail`/`title` as message fallbacks, so an
 * RFC 9457 problem document works with no custom decoder.
 *
 * There is deliberately no equivalent seam on the memory adapter. It never
 * decodes a `Response` — its routes return failures directly — so there is
 * nothing for a decoder to do. The asymmetry is the shape of the problem, not
 * an oversight.
 *
 * # The timeout is `AbortSignal.timeout`, and this is not a style choice
 *
 * Aborting a controller by hand raises an `AbortError`, which is
 * indistinguishable from the caller's own cancellation — so every timeout gets
 * classified `canceled`, and `canceled` is never retried. Measured: an earlier
 * draft of this file had exactly that defect, and its `TimeoutError` branch was
 * dead code that could not fire. `AbortSignal.timeout` raises `TimeoutError`,
 * and the caller's signal is COMBINED with it rather than replaced.
 *
 * Transport errors are matched by `name` rather than `instanceof DOMException`,
 * because under a test DOM the global is the test environment's and `fetch`
 * throws the runtime's.
 *
 * # A JSON parse failure on a 2xx is ours, not the network's
 *
 * It is decoded outside the transport `catch` on purpose. Folded in, a contract
 * break would be labelled `unavailable` — which is retryable, so the client
 * would hammer an endpoint that is answering perfectly well with the wrong
 * shape.
 *
 * # An unserved fixture route is `internal`, not `not_found`
 *
 * A real server 404s for a path it does not serve, so the first version of this
 * returned `not_found`. That was wrong: the fixture failing to answer is a
 * FIXTURE bug, not a server behaviour being reproduced, and labelling it 404
 * let `optional` report "looked and found nothing" about a route that had never
 * been asked. It is `internal` with `type: "unserved_route"`. A screen that
 * wants to exercise a 404 registers a route that returns one.
 */
export {};
