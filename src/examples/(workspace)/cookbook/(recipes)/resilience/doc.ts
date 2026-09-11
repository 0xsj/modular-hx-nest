/**
 * Resilience cookbook — observable contract, written before implementation.
 *
 * Every example owns an isolated simulation, with no real account writes.
 * Replay creates fresh simulation state. Leaving the page cancels outstanding
 * work. Initial render is deterministic; scenarios begin through user actions.
 * Existing cards, fields, buttons, feedback and tokens compose the page.
 * Status changes are announced politely, without moving keyboard focus.
 *
 * 1. Response boundary
 * A first failed read shows a regional failure, never an invented empty list.
 * Valid reads show decoded values. A malformed object, a list containing a bad
 * member, or a refresh refusal cannot replace previous valid values. Previous
 * values are labelled stale. A valid empty list replaces previous values with
 * an explicit empty state. Recovery clears the failure. The shell remains usable.
 *
 * 2. Latest selection wins
 * An earlier read starts and its response is held. A newer selection completes
 * successfully; releasing the earlier response must not overwrite the newer
 * selection or its results, even when the transport ignores cancellation.
 * Failures from obsolete requests also cannot overwrite the current state.
 * The response order is controlled by gates, not by racing wall-clock delays.
 *
 * 3. Preserve the draft; reconcile the outcome
 * A note has an editable draft distinct from its last confirmed save. Saving
 * captures a draft and a fresh operation id. Only one save/reconciliation is
 * active at a time; repeated activation cannot issue a second write.
 * A definite validation refusal preserves all input and permits correction.
 * Any other unsuccessful write is conservatively an unknown outcome. The
 * pending attempt (including its id and captured draft) remains available.
 * A fresh save is blocked until reconciliation establishes that outcome.
 * Reading the operation receipt either confirms the captured save, reports it
 * terminally absent, or fails and leaves the outcome unknown. Terminal absence
 * must guarantee that no write can still complete for that operation; an
 * eventually consistent "not found yet" cannot unlock a fresh attempt.
 * Reconciliation never writes.
 * Editing during a save or reconciliation is allowed; a late receipt must not
 * overwrite newer input or label it saved. Saved means draft equals the last
 * confirmed receipt. These drafts are visit-local, not persisted across reloads.
 *
 * The example server deduplicates matching operation ids, refuses reuse with
 * different content, and returns receipts. This is an EXPLICIT backend contract,
 * not a guarantee a frontend can provide for an arbitrary server. A simulated
 * lost response occurs after a real change to this in-memory server. Failed
 * receipt reads are also reproducible. No automatic write retry is performed.
 *
 * Tests exercise these observable guarantees through injected ports and UI
 * controls. They are ordinary tests with implementation visibility; no blind
 * writer provenance is claimed. Deliberate mutations check selected guarantees.
 */
export {};
