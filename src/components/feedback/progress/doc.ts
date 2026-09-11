/**
 * Progress — how much of an operation has completed.
 *
 * § CONTRACT
 * A label is required. A null value means an unknown amount, not zero. A
 * numeric value is bounded to zero through max (100 by default). The native
 * progress element exposes that distinction. The caller owns live updates,
 * completion messages, and any cancellation action.
 *
 * § MECHANICS
 * Native progress semantics and token-based styling; no timer or fake progress.
 */
export {};
