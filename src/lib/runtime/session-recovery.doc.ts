/**
 * Session recovery contract
 * =========================
 * A coordinator belongs to one verified account and one local return address.
 * Only unauthenticated failures expire it; forbidden and network failures do
 * not become sign-out. Expiry blocks new protected work but does not assert
 * that an in-flight write was refused. Draft/receipt ownership stays with the
 * existing account-scoped save model. Recovery verifies identity through an
 * injected port. A different account cannot resume this workspace. Late
 * verification after another expiry/disposal cannot reopen it. Recovery never
 * retries a write, reads a receipt, stores credentials, or redirects itself.
 * Local return addresses retain query/hash; external and ambiguous addresses
 * fall back to /app. The framework caller navigates only after same-account
 * verification. Abort is best effort; generation ownership is authoritative.
 *
 * Cookbook: expiry while editing and after commit, failed verification, wrong
 * account, reload-restored draft and unresolved receipt, explicit reconciliation.
 * Browser storage is convenience persistence, not an account security boundary.
 * A production adapter owns real authentication, cookie/session invalidation,
 * cache disposal on identity changes, receipt authorization and retention.
 *
 * Written before implementation. Tests here are implementation-visible, not a
 * blind agent run; mutation evidence only measures the listed fault hypotheses.
 */
export {};
