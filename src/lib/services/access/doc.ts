/**
 * Capability contract
 * ===================
 * A snapshot is scoped to subject + resource and has a monotonic revision.
 * Each named capability is allowed, or denied with a nonempty explanation.
 * Missing capabilities deny by default. Unknown/loading/failed policy reads
 * cannot enable actions using a previous grant. Identity mismatch, malformed
 * decisions and stale revisions are rejected. Invalidation immediately removes
 * grants; late reads cannot restore them. A forbidden operation invalidates
 * the view's policy and protected data, without treating it as session expiry.
 *
 * The client receives decisions, not a role-to-permission policy engine.
 * Services take an injected HttpClient. The backend must check authorization
 * independently on every operation and scope snapshots to the current caller.
 * Cookbook controls include explicit denial, unavailable policy, revocation
 * while open, and a stale enabled action refused by the simulated backend.
 * Written before implementation; tests are ordinary implementation-visible.
 */
export {};
