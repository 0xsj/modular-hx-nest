/**
 * kernel — what everything may import and which itself imports nothing.
 *
 * # cn is five lines because the alternatives solve a problem this tree does not have
 *
 * `clsx` is the same join with a dependency and an object/array API nothing here
 * uses. `tailwind-merge` exists to resolve conflicts between competing utility
 * classes — a problem created by utility classes, which this tree does not have,
 * because CSS Modules hash a class per file and two of them cannot collide.
 *
 * So the whole job is: drop falsy values, join the rest with a space. The
 * function returns `""` rather than `undefined` for an empty result, because
 * `className={undefined}` and `className=""` render differently in a diff and
 * one of them is noise.
 *
 * `0` is deliberately kept rather than dropped. It is never a class name, and a
 * caller passing one has made a mistake worth seeing in the DOM rather than one
 * silently swallowed.
 *
 *
 * # The failure model
 *
 * `decisions/0002-a-failure-is-a-value-and-only-domain-kinds-are-narrowed` is the
 * record. The four claims, in one place:
 *
 *   1. A kind is a CLIENT BEHAVIOUR, not a server condition. Ten of them. Two
 *      server conditions producing the same screen are one kind, and a
 *      product's own vocabulary rides in `type` rather than as an eleventh.
 *   2. A failure is a VALUE — a discriminated union of plain objects. Not a
 *      class with a `kind` field. That buys per-kind payloads, exhaustiveness
 *      that fails the build, and survival across the server/client boundary.
 *   3. Seven kinds are TRANSPORT and three are DOMAIN. Any call can produce a
 *      transport failure, so no service may narrow one away; only the domain
 *      set is a service's to promise.
 *   4. `Result` carries the failure, so nothing below the framework edge throws.
 *
 * # Why `Result` is a class here and `Failure` is not
 *
 * A `Failure` crosses the server-function boundary constantly — it is passed as props and
 * returned from Server Actions — so it must be plain data. A `Result` never
 * crosses it: the tier that produced one unwraps it. So the ergonomic win of
 * methods costs nothing that is actually paid.
 *
 * That asymmetry creates ONE rule with no type-level enforcement: a `Result`
 * must not be returned from a Server Action or passed to a client component.
 * `toJSON` makes an accidental serialisation degrade to `{ ok, value }` rather
 * than `{}`, and `boundaries.test.ts` is the detection — a rule with no check
 * is a preference, and this design has no business shipping one.
 *
 * # Correlation, and what does NOT belong here
 *
 * `decisions/0003-the-client-sends-a-correlation-id-and-provenance-is-a-domain-concern`
 * adds `correlationId` beside `requestId`, and both folds preserve it.
 *
 * The distinction that record exists to hold: correlation answers *what else
 * happened when this happened* — operational, transient, ours. PROVENANCE
 * answers *why do you believe this value* — durable, the user's, and a property
 * of a domain rather than of a transport. Provenance does not belong on a
 * failure, and a lineage type with no domain behind it is a modelled tier with
 * no caller.
 *
 * # Three states, and why `not_found` is not the answer to "is it there"
 *
 * *Nobody looked* and *looked and found nothing* are different facts. A read
 * whose absence is legitimate returns `Result<T | null, …>` via `optional`,
 * which removes `not_found` from the failure type — so a caller cannot handle a
 * case that can no longer occur.
 *
 * `optional` is COMPENSATION, not the ideal. If you control the API, an
 * endpoint that returns 200 with `null` for legitimate absence is strictly
 * better: it never conflates the two facts in the first place, and no predicate
 * has to guess which a 404 meant. Reach for `optional` when the backend is not
 * yours to change, and prefer `absentWhenType` over `anyNotFound` — the latter
 * treats a typo in an endpoint as emptiness.
 *
 * # Why this is a module and not a file next to the first caller
 *
 * Because the second caller is always a different category, and the version that
 * lives beside the first one gets imported sideways — which is the beginning of
 * a `utils` directory whose import list nobody agreed to.
 *
 * # The floor
 *
 * This package imports nothing — not Solid, not a component, not `lib/http`.
 * That is what makes it safe for every tier to depend on and what makes a cycle
 * through it impossible rather than unlikely. A future addition that needs an
 * import does not belong here.
 */
export {};
