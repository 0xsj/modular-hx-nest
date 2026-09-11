/**
 * Realtime — notifications arrive through a subscription port.
 *
 * CONTRACT (written before implementation)
 * A source subscribes an observer to typed events, connection state, and decode
 * failures. Unsubscribe releases that subscription's listeners and transport.
 * Creating a source does not open a connection. Memory and WebSocket sources
 * have the same observer contract; wire envelopes are decoded at the adapter.
 * The socket adapter reconnects abnormal closures with bounded backoff, reports
 * reconnecting state, and cancels timers/socket work after unsubscribe. It does
 * not retry policy/auth closures or promise event delivery/replay. An open event
 * says whether this subscription has connected before, allowing a full resync.
 * Malformed messages report a Failure and do not become domain events.
 *
 * The query binding maps events to caller-chosen cache prefixes, coalesces bursts,
 * and resyncs declared keys on connection. It invalidates data; it does not force
 * a render or remount the UI. The cache remains the authority for pending/error
 * state. Transport state and stale-but-visible data are separate facts.
 *
 * LIMITS
 * No vendor envelope, bearer strategy, subscription protocol, optimistic socket
 * write, replay cursor, or exactly-once claim. Applications needing ordering or
 * deduplication own event IDs/revisions in their decoder/domain contract.
 * The cookbook uses a controllable in-process source, explicitly labelled as a
 * simulation; the WebSocket adapter is exercised with a fake transport in tests.
 * Tests have implementation access; this is not blind-test provenance.
 */
export {};
