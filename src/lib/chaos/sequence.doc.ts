/**
 * Request sequences — contract written before implementation.
 *
 * An explicit, finite script over a transport port for isolated simulations.
 * Only the NEXT step may match a request; unrelated requests pass through and
 * do not consume it. A matching step is consumed synchronously on invocation,
 * so concurrent requests cannot take the same step. Exhaustion passes through.
 * A pre-aborted request returns canceled without consuming a step.
 *
 * reply supplies an arbitrary successful body without calling through.
 * fail returns a supplied Failure without calling through.
 * lose-response calls through ONCE and replaces only a success with the
 * supplied failure: the underlying write may already have committed.
 * hold-response calls through ONCE and holds its captured result behind a named
 * gate. Releasing a gate is idempotent and may precede the response reaching it.
 * Ordinarily cancellation releases a held request as canceled. A step can
 * explicitly ignore caller cancellation to reproduce a late, obsolete result.
 * Disposal always releases held work as canceled, including that exception;
 * subsequent requests are canceled and cannot reach the underlying adapter.
 * Abort listeners are detached when work settles. Scripts never retry writes.
 *
 * This is an explicit simulation tool, not a URL option. The cookbook root
 * constructs it ONLY over isolated memory fixtures. It runs in production
 * previews of that example; the existing application-wide chaos decorator
 * remains disabled in production. A product must never wire these scripts into
 * a real backend implicitly.
 */
export {};
