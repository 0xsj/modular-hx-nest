/**
 * Storage — validated, versioned browser documents behind a string-storage port.
 *
 * CONTRACT (written before implementation)
 * A registered document owns its key, version, and decoder from unknown.
 * read returns Result<missing | found<T>>. Missing is a successful observation;
 * blocked storage, corrupt JSON, invalid data, and unsupported versions are not
 * defaults. A read never writes, removes, or repairs the saved document.
 * Optional migrations decode older versions in memory; saving is explicit.
 * Writes validate the JSON round trip before committing. Failed writes leave
 * the old value intact and are observable Results. A newer envelope is protected
 * from an older writer; removing this particular key is the explicit reset.
 * Keys are namespaced; there is no origin-wide clear operation. Callers include
 * account/workspace identity when the document is private to that identity.
 * Browser access is lazy and safe to import during SSR. Denied access and quota
 * exhaustion become Failure values, with storage-specific details in `type`.
 * Subscribers receive successful changes in this tab and storage events from
 * other tabs, including external clear. Every subscription has cleanup.
 * The browser adapter defaults to local storage. Its explicit session area uses
 * the same validation/Result contract but isolates documents to a tab and its
 * same-origin child contexts. Reload retains session data; closing the tab ends
 * its normal lifetime. Browser session restoration may restore it too, so this
 * is a lifetime choice, not a secure-erasure guarantee.
 *
 * LIMITS
 * This is synchronous, best-effort browser persistence, not a database. It has
 * no atomic read-modify-write, locking, encryption, or server durability. Separate
 * tabs use last-writer-wins; the read-before-write version guard is not a lock.
 * Decoder code is caller-owned; exceptions become invalid data, never a cast.
 * Theme's tiny first-paint path remains separate: losing a preference and losing
 * an explicitly saved layout have different consequences for their callers.
 *
 * VERIFICATION
 * Ordinary contract tests have implementation access. This pass is not a blind
 * spec-test run and makes no mutation-score claim.
 */
export {};
