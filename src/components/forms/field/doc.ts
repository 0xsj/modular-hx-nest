/**
 * Field — the component that makes the commonest accessibility defect
 * unrepresentable rather than unlikely.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ § CONTRACT — the oracle. Names no library, contains no code.              │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * # What it is
 *
 * The owner of a form control's LABEL, its DESCRIPTION and its ERROR. It does
 * not own the control. It generates the identifiers those three need, and hands
 * them to the control as props the caller applies.
 *
 * # Shape
 *
 *     label      string, REQUIRED
 *     hint?      string — a description, always present when given
 *     error?     string — a validation message
 *     required?  boolean
 *     children   a FUNCTION, called with the props the control must carry
 *
 * The function receives exactly the attributes to spread onto the control:
 *
 *     id                 the identifier the label points at
 *     aria-describedby?  the error and hint identifiers, or absent
 *     aria-invalid?      true, or absent
 *     required?          true, or absent
 *
 * # Behaviour
 *
 * The label is associated with the control by identifier, never by nesting.
 * Every generated identifier is unique to the instance: two Fields on one page
 * with the same label must not collide.
 *
 * `aria-describedby` names the error FIRST and the hint second, when both are
 * present, because a reader announces them in that order and the error is the
 * more urgent. When neither is present the attribute is absent — never empty.
 *
 * `aria-invalid` is present only when there is an error, and `required` only
 * when required. Absent, never false: `aria-invalid="false"` is a different
 * announcement from no attribute at all.
 *
 * A required field marks itself visibly, and that mark is hidden from assistive
 * technology — `required` on the control is the announcement, and hearing "star"
 * after every label is noise.
 *
 * An error is rendered when given and the region is absent otherwise. The error
 * text is reachable from the control through `aria-describedby`.
 *
 * # Deliberately absent
 *
 * A `name` prop, a value, an onChange. Field owns none of the control's data —
 * it owns the three things AROUND the control. A Field that took a value would
 * be a form library.
 *
 * Validation. The error is a string a caller supplies. Where it comes from —
 * a service's per-field messages, a schema, a server round trip — is not this
 * component's business.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ § MECHANICS — NOT the oracle. Strip before handing this to a test writer. │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * # Why children is a FUNCTION and not a node
 *
 * This is the whole design. `protocols/accessibility.md`: the defects worth
 * preventing are the ones invisible to the person who introduced them — a form
 * renders, looks right, passes a screenshot review, and is unusable with a
 * screen reader.
 *
 * A Field taking a node would have to REACH INTO the child to wire it — cloning
 * an element and injecting props — which works until somebody nests the control
 * one level deeper, and then fails silently. A Field that merely rendered a
 * label beside its child would leave the wiring to a caller's memory, which is
 * the status quo this exists to replace.
 *
 * A function argument cannot be forgotten in the same way: there is nothing to
 * render without calling it, and the props arrive already named as the
 * attributes they become. A caller can still ignore what it is handed — the
 * shape makes the mistake visible rather than impossible, which is the honest
 * claim.
 *
 * # Why the identifiers come from the framework's own generator
 *
 * They must be stable across a server render and its hydration, and unique per
 * instance. A counter in module scope is neither: it restarts per process on
 * the server and continues on the client, so the two disagree.
 *
 * # The label element comes from `Label`, not a raw element
 *
 * One labelling implementation in the tree. `Label` wraps the headless
 * library's, which adds click-to-focus behaviour for controls the platform does
 * not handle natively — and that is the sort of thing that should exist once.
 */
export {};
