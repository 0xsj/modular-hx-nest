/**
 * Save draft — contract recorded before implementation.
 *
 * A framework-free state machine over caller-owned draft, attempt and receipt
 * types. The caller supplies equality, attempt construction, receipt matching,
 * and which refusals definitively establish no commit. State distinguishes
 * ready, refused, saving, unknown, checking and terminal not-recorded.
 *
 * Draft and last confirmed baseline are separate. Editing during a save/check
 * is allowed. A matching receipt updates the baseline and confirmed receipt,
 * never overwrites newer input. Mismatched receipts stay unknown. Pending or
 * unknown attempts block fresh saves; failed checks never prove absence.
 * Cancellation invalidates obsolete completions and retains an unknown attempt.
 * Restored pending attempts are unknown, never resumed automatically.
 *
 * Optional synchronous checkpointing returns Result. The captured attempt must
 * checkpoint successfully before invoking save. Checkpoint errors are visible
 * separately from the save outcome and preserve current input. Failure to store
 * a confirmation cannot falsely undo a server success. Retrying checkpointing
 * invokes no server write. Discard is refused while an outcome is unresolved.
 *
 * Construction is inert. No framework, browser, storage adapter, automatic
 * retries, timers, domain fields, or network construction belongs here.
 * The note and item recipes supply the two concrete policies.
 */
export {};
