/**
 * SelectionCard — a larger label and description around a real choice control.
 *
 * § CONTRACT
 * `mode="single"` is a radio option inside the existing RadioGroup. The group
 * owns its name, value, arrow navigation, and onValueChange. `mode="multiple"`
 * is an independent boolean checkbox with controlled/defaultChecked support.
 * Both require a visible label and value, and can have a description and static
 * supporting content. The whole label/card area activates the control. Selected
 * state is visible through the control's mark and a border treatment. Disabled
 * choices stay readable, cannot change, and are skipped during keyboard travel.
 * Form names submit values. The caller handles reset of controlled state.
 * Supporting content must not contain other interactive elements; use a regular
 * Card for a record with independent actions. No selection handler is placed on
 * the card container: focus, keyboard, and form semantics belong to the control.
 *
 * § PROVENANCE
 * Contract written before implementation, 2026-09-10. Verification in this pass
 * is implementation-aware; it is not an independent blind spec-test run.
 * Label/description wiring and submitted values have regression tests. Browser
 * checks covered card-area activation, arrow/Tab navigation, disabled choices,
 * single/multiple selection, and caller-owned reset. No screen-reader run.
 */
export {};
