/**
 * The decoder — the only file permitted to name a wire key, a header or a
 * status code.
 *
 * An oracle under `flover-solid ADR 0001`; written before `envelope.ts`
 * existed. §4 is normative and numbered.
 *
 *
 * # 1 · What it is for
 *
 * A server sends bytes. Something has to turn ANY response into exactly one
 * `Failure`, and everything above this file sees only that failure — no
 * `Response`, no status number, no header name, no `res.json()`.
 *
 * Two properties make that safe against a server nobody here controls:
 *
 * **It is TOTAL.** Every response becomes exactly one failure. It never throws
 * — not on a body that is not JSON, not on an empty body, not on a body some
 * other code already consumed. An error path that can itself fail replaces one
 * diagnosis with a worse one.
 *
 * **It never widens the union.** A `kind` this client does not recognise is
 * preserved as data rather than admitted as a new member. The client is never
 * WRONG at runtime, only less specific.
 *
 *
 * # 2 · The body classifies; the status is the fallback
 *
 * When the body declares a kind we recognise, that wins. The server has
 * already decided how a caller should react, and recovering a kind from the
 * status when the body states one is the same work done twice, drifting.
 *
 * `kindFromStatus` exists for bodies that are not ours: a proxy's 502, an HTML
 * error page, a framework's default 404 for a route nobody built.
 *
 * **An unrecognised kind falls back to the STATUS, not to `internal`.** This is
 * the one worth arguing. A server sending `{"kind":"seat_limit_reached"}` with
 * 409 is telling us two things, and only one of them is unfamiliar. Folding to
 * `internal` discards the 409 and renders "something went wrong" for a
 * conflict the client could have handled; classifying by status keeps the
 * behaviour and puts the unfamiliar word in `type`, where a product that wants
 * it can read it. Nothing is lost either way, and one way is more useful.
 *
 * ## The status map is to BEHAVIOUR, not to HTTP
 *
 * It is not a lookup table of RFC meanings. Two statuses that call for the
 * same client behaviour map to the same kind, which is why there are ten kinds
 * and not thirteen.
 *
 *     400 422 428  -> invalid          the request must change before retrying
 *     409 412      -> conflict         the state moved under us
 *     401          -> unauthenticated
 *     403          -> forbidden
 *     404          -> not_found
 *     429          -> rate_limited
 *     499          -> canceled
 *     503          -> unavailable
 *     504          -> timeout
 *     anything else-> internal
 *
 *
 * # 3 · Transport failures have no response at all
 *
 * DNS, a dropped socket, an abort. There is no status to read, so the only
 * signal is the thrown value.
 *
 * **Matched by `name`.** Measured on 2026-09-09: under this runtime a
 * hand-rolled `controller.abort()` throws `AbortError`, `AbortSignal.timeout`
 * throws `TimeoutError`, and `AbortSignal.any([timeout, callerSignal])`
 * preserves `TimeoutError` when the timeout is what fired.
 *
 * `instanceof DOMException` is TRUE for all three, which is why it is not the
 * discriminator: it is not unreliable, it is insufficient — every one of them
 * is a `DOMException`, and only the name says which.
 *
 * **The distinction is load-bearing.** A timeout classified as a cancellation
 * would never be retried, because a cancellation is something the caller
 * asked for. That is the reason a timeout must come from `AbortSignal.timeout`
 * rather than from a controller aborted by hand.
 *
 * **The honest limit, and it is measured too.** What name arrives is the
 * environment's decision, not this function's. Under the simulated DOM this
 * project tests in, BOTH routes report `NetworkError` — so driving a real
 * `fetch` there cannot verify this mapping. The contract below is therefore
 * about the MAPPING from a name to a kind, and it is written so it can be
 * checked by handing the function a shaped value rather than by making a
 * request.
 *
 *
 * # 4 · CONTRACT
 *
 * ## Totality
 *
 *   E1  `failureFromResponse` returns a `Failure` for every response and never
 *       throws. Including: a body that is not JSON, an empty body, a body that
 *       has already been consumed, and a body that is valid JSON but not an
 *       object.
 *
 *   E2  `status` on the returned failure is always the response's status.
 *
 * ## Classification
 *
 *   E3  A body declaring a kind in `FAILURE_KINDS` produces that kind,
 *       whatever the status says.
 *
 *   E4  A body declaring a kind NOT in `FAILURE_KINDS` produces the kind the
 *       STATUS maps to, and preserves the declared value in `type`.
 *
 *   E5  A body with no `kind` produces the kind the status maps to.
 *
 *   E6  The status map is exactly the table in §2, and any status absent from
 *       it produces `internal`.
 *
 *   E7  A body's own `type` wins over a preserved unrecognised kind. They
 *       occupy the same field and the explicit one is the server's intent.
 *
 * ## Metadata
 *
 *   E8  `message` is the first present of: body `message`, body `detail`, body
 *       `title`, the response's `statusText`, and finally a non-empty constant.
 *       An empty string at any level is treated as absent.
 *
 *   E9  `requestId` is the body's `request_id`, else the request-id header,
 *       else absent.
 *
 *   E10 `correlationId` is the body's `correlation_id`, else the correlation
 *       header, else absent. Absent here does NOT mean the failure has no
 *       correlation — an adapter attaches what it sent.
 *
 * ## Per-kind payloads
 *
 *   E11 An `invalid` failure always carries `fields`. It is built only from
 *       string-valued entries of the body's `fields`; a `fields` that is
 *       missing, null, an array or a scalar yields `{}`.
 *
 *   E12 A `rate_limited` failure takes `retryAfter` from the body's
 *       `retry_after`, else the `Retry-After` header, else it is absent. A
 *       value that is not a finite number is absent, and zero is a value.
 *
 *   E13 No kind other than `invalid` carries `fields`, and none other than
 *       `rate_limited` carries `retryAfter`.
 *
 * ## Transport
 *
 *   E14 `failureFromTransport` maps by `name`: `AbortError` to `canceled`,
 *       `TimeoutError` to `timeout`, and anything else to `unavailable`.
 *
 *   E15 It never throws, for any input — including `null`, `undefined`, a
 *       string, a number, and an object with no `name`.
 *
 *   E16 Its result carries no `status`. There was no response.
 *
 *
 * # 5 · Deliberately absent
 *
 * **A second decoder for a different backend.** `ClientConfig.decodeFailure`
 * replaces this one wholesale. A product adopting the template does not edit
 * this tier; it passes its own function.
 *
 * **Retry scheduling.** `retryAfter` is carried as the wire stated it. What to
 * do with it is policy and belongs where retries happen.
 *
 * **Any use of the response body on a 2xx.** This file decodes failures. A
 * successful body is the adapter's business, and a body that will not parse on
 * a 200 is a contract break rather than a transport problem — folding it in
 * here would label it `unavailable`, which is retryable, and the client would
 * hammer an endpoint answering perfectly well with the wrong shape.
 *
 *
 * # 6 · What this specification does NOT decide
 *
 *   - The unit of `retryAfter`. It is carried as the wire states it.
 *   - What any adapter does with the failure once decoded.
 *   - Whether a 2xx with an unreadable body is this tier's problem. §5 says it
 *     is not this FILE's; naming the kind belongs to the adapter's spec.
 *   - The casing of header names as they arrive. `Headers` is case-insensitive
 *     by specification and this file relies on that rather than restating it.
 */
export {};
