/**
 * Successful responses — contract written before implementation.
 *
 * A transport's generic parameter does not validate JSON. Services request
 * unknown, decode the successful value, then narrow failures. Both adapters
 * go through the same decoder. No schema library or backend envelope is
 * imposed: a response reader validates and projects its backend's shape into
 * the domain type. A different success envelope changes that reader.
 *
 * responseDecoder(name, reader) accepts unknown and returns Result<T,
 * Fails<"internal">>. Undefined from the reader means rejection; null is a
 * legitimate value only when the reader explicitly permits it. Exceptions in
 * a reader become the same failure. Rejections have type invalid_response,
 * are not retryable, and disclose neither the payload nor an exception message.
 * The contract name is developer-supplied, never taken from the payload.
 *
 * Object readers require non-null, non-array records and explicitly select
 * their output fields. Unknown fields are tolerated but not copied into DTOs.
 * Array readers validate EVERY item, reject sparse arrays, preserve ordering,
 * and accept the empty array. Required identity/token/text fields are nonempty
 * strings; booleans are booleans, counts are nonnegative safe integers, and
 * displayed timestamps are ISO date-times parseable by Date. Optional fields
 * may be absent; a present malformed field rejects the whole document.
 *
 * Existing services validate every consumed success body. Acknowledgement-only
 * operations deliberately discard their body. An optional item accepts null;
 * a required item never does. Domain refusal narrowing remains unchanged.
 *
 * Verification provenance: the contract precedes the implementation. Tests in
 * this change are ordinary implementation-visible tests, not a barriered spec
 * run. Targeted mutation checks are recorded separately; they do not establish
 * an information barrier or completeness of the specification.
 */
export {};
