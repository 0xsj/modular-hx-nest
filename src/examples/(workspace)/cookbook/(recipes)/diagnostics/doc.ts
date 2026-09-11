/**
 * Inspector recipe — contract written before implementation.
 *
 * Isolated sample reads exercise the real service, request wrapper, and decoder.
 * Show successful reads, valid empty data, transport refusals, malformed success,
 * recovery, and user cancellation. Retain the last good region after failure.
 * Each action has an independent trace; recovery has an explicit recovery span.
 * Pending work is canceled when leaving. The buffer is visit-local, bounded,
 * filterable by trace, and clearable. No trace starts during render/hydration.
 * Raw data, backend messages, URLs, and form contents never enter the timeline.
 * Timeline changes do not move focus or announce every appended row; a single
 * operation status announces the result. The inspector is cookbook UI, composed
 * from existing primitives, not a global production logger.
 */
export {};
