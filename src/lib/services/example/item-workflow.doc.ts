/**
 * Editable item service extension — contract recorded before implementation.
 *
 * Existing listItems/getItem keep their public Item shape. Workflow detail reads
 * add a positive integer revision. An update captures id, expected revision,
 * operation id, name and host. An operation id deduplicates identical content;
 * reuse with different content is conflict. Stale revisions and duplicate hosts
 * are definite refusals and do not commit. Names/hosts have bounded validation.
 * Successful receipts identify the exact operation and submitted fields and
 * return a revision exactly one greater than expected. All consumed responses
 * are decoded and projected; dynamic path segments are encoded.
 *
 * Lookup returns a validated receipt or explicitly tagged terminal absence.
 * A failed lookup, malformed reply, wrong receipt or bare not_found is not
 * terminal absence. A real backend must supply deduplication and authoritative
 * operation lookup before adopting this workflow's uncertain-save recovery.
 *
 * Fixtures persist each mutation and its receipt as one snapshot before
 * returning success. Refused persistence leaves the prior snapshot untouched.
 * State is supplied through a port: fixtures know no browser or storage API.
 * A root may inject a durable tab-local document or an in-memory test document.
 */
export {};
