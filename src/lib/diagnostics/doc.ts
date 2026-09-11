/**
 * Diagnostics — contract written before implementation.
 *
 * An opt-in recording port, an inert default, a bounded memory recorder, and
 * per-action trace scopes. No global current trace, storage, network exporter,
 * browser access, or framework dependency. The caller supplies a trusted static
 * operation label and an opaque correlation id. Every scope has its own trace
 * id; concurrent request spans within it have distinct span ids.
 *
 * A span records a start and one terminal event for operation, request, decode,
 * or recovery. Success, failure, cancellation, and an unexpected throw remain
 * distinct. Recording never changes the original Result or thrown value, calls
 * work exactly once, and cannot trigger retry. Broken clocks, synchronous sink
 * exceptions, or rejected sink promises must not break the operation.
 *
 * Events contain only ids, static labels, stage, time/duration, and a safe
 * failure classification: kind, retryability, bounded cause kinds, and whether
 * the response contract was rejected. No URLs, headers, bodies, credentials,
 * Failure.message/fields/type, arbitrary metadata, or thrown exception text.
 * Labels/ids must be caller-owned, not derived from form values or wire data.
 * The memory recorder projects supported fields again, bounds retained entries
 * and strings, returns immutable stable snapshots, and counts evicted entries.
 * Clear removes retained entries and resets the eviction count. An already
 * active span may record a later finish. Subscription cleanup is idempotent.
 *
 * Transport observation surrounds chaos/fixture adapters. A request success
 * means a transport answer; the subsequent decoder can still reject it. This
 * distinction is visible in the cookbook. Services forward the optional trace
 * alongside cancellation; response readers observe decoding without recording
 * the input. Absence of a trace keeps existing behavior and records nothing.
 *
 * Tests are ordinary implementation-visible tests. No enforced blind-writer
 * or production telemetry delivery guarantee is claimed.
 */
export {};
