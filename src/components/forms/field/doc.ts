/**
 * Field — the component that makes the commonest accessibility defect
 * unrepresentable rather than unlikely.
 *
 * # What it is
 *
 * The owner of a form control's LABEL, its DESCRIPTION and its ERROR. It does
 * not own the control. It generates the identifiers those three need and hands
 * them to the control as props the caller applies.
 *
 *     <Field label="Host" hint="One per line" error={problem}>
 *       {(control) => <Input {...control} placeholder="api.example.com" />}
 *     </Field>
 *
 * # `children` is a FUNCTION, and that is the whole design
 *
 * `protocols/accessibility.md`: the defects worth preventing are the ones
 * invisible to the person who introduced them — a form renders, looks right,
 * passes a screenshot review, and is unusable with a screen reader.
 *
 * A Field taking a NODE would have to reach into the child to wire it, cloning
 * an element and injecting props. That works until somebody wraps the control
 * in a `<div>` for layout, or an adapter, or a conditional fragment — and then
 * the props land on the wrapper, the label points at an id nothing has, and
 * **nothing errors.**
 *
 * A function argument cannot be forgotten the same way: there is nothing to
 * render without calling it, and the props arrive already named as the
 * attributes they become. A caller can still ignore what it is handed, so the
 * honest claim is that the shape makes the mistake VISIBLE rather than
 * impossible.
 *
 * It also means Field never has to know what the control is. The contract is
 * the bag of props, not a component type — so a select, a combobox, a date
 * field, none of which exist yet, need no change here. Cloning couples them,
 * because the wrapper must know enough about the child to decide what to
 * attach.
 *
 * # The bag is four things, and leaving one out is worse than it looks
 *
 *     id                 matched to the label's `for`
 *     aria-describedby   the error id then the hint id
 *     aria-invalid       true, or absent
 *     required           true, or absent
 *
 * `aria-invalid` is derived here rather than left to the caller. Leaving it out
 * because *the caller knows if it passed an error* produces two sources for one
 * fact, and they disagree the first time somebody forgets.
 *
 * # Error before hint, and the hint is not replaced
 *
 * `aria-describedby` is announced in the order the ids are listed, not in
 * document order. Error first, deliberately: somebody who has just failed
 * validation hears what is wrong before the standing advice. The DOM order
 * matches so a sighted reader gets the same sequence.
 *
 * The hint is **not** swapped out for the error. "Use at least twelve
 * characters" is still true while the field is wrong, and removing it takes the
 * instruction away exactly when it is needed. Most form components do the
 * opposite.
 *
 * # Absent, never false
 *
 * `aria-invalid="false"` is a rendered attribute that announces nothing and
 * still matches `[aria-invalid]` — which would style every valid field as an
 * error. Same for `required` and for an empty `aria-describedby`.
 *
 * # Identifiers come from the framework's generator
 *
 * They must be stable across a server render and its hydration, and unique per
 * instance — two Fields with the same label on one page is normal. A module
 * counter is neither: it restarts per process on the server and continues on
 * the client, so the two disagree and hydration reports a mismatch.
 *
 * # Deliberately absent
 *
 * **A name, a value, an onChange.** Field owns none of the control's data — it
 * owns the three things AROUND the control. A Field that took a value would be
 * a form library.
 *
 * **Validation.** The error is a string a caller supplies. Where it came from —
 * a service's per-field messages, a schema, a server round trip — is not this
 * component's business. A primitive that validates has to hold a schema, and
 * then every form in the product is shaped by whichever library this file
 * imported.
 *
 * **A horizontal layout variant.** `display: grid` with a gap, and a caller
 * that wants label-beside-control writes that grid where the layout is.
 */
export {};
