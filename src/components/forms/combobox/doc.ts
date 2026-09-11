/**
 * Searchable choices — selection is a value; the query is temporary input.
 *
 * § CONTRACT
 * Combobox chooses one option ID or null. MultiSelect chooses an ordered array
 * of unique option IDs. Both accept controlled or default values and expose
 * onValueChange. Option IDs are stable, unique, nonempty strings. Labels may
 * repeat. Filtering searches labels; typing a query alone does not select it.
 * Free-form values are not accepted. Dismissing an unmatched query restores
 * the committed selection. Empty options and no matching options are explicit.
 * Disabled options cannot be newly selected. Disabled controls cannot be
 * changed or reached by Tab. Read-only values remain readable and focusable.
 * Arrow keys explore options, Enter commits, and Escape dismisses the popup.
 * MultiSelect keeps its selection when the list is filtered, marks selected
 * options, and offers named removal controls for the selected values.
 * Every instance owns a required visible label and optional hint/error wiring.
 * A name submits IDs, never search text; multiple values repeat that name.
 * Native form reset restores uncontrolled defaults; callers reset controlled
 * state. Caller-owned values must refer to supplied options. No fetching,
 * routing, persistence, creation of options, or virtualization is assumed.
 *
 * § MECHANICS
 * The headless choice engine owns focus, filtering, selection, dismissal, and
 * form behavior. Flover owns its tokens and maps its public string values.
 * These compound controls compose their own label and description so the
 * library can wire the text input, list, and selected-value group together.
 * Their visual field vocabulary matches Field; ordinary inputs still use Field.
 * A trigger/removal button's slot supplies its field/item relationship. Give
 * the button the action word only; including the related name in aria-label
 * duplicates it in the computed accessible name. The tests check the result.
 *
 * § PROVENANCE
 * Contract written before the Flover implementation, 2026-09-10. Tests in this
 * pass are implementation-aware, not an independent blind spec-test run.
 */
export {};
