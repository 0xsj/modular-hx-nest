/**
 * DatePicker and DateRangePicker — calendar dates, with no implied instant.
 *
 * § CONTRACT
 * DatePicker accepts a Gregorian YYYY-MM-DD string or null. DateRangePicker
 * accepts { start, end } with inclusive dates, or null. Complete dates
 * are selected by calendar or typed through date segments. Range selection
 * commits a complete pair; starting another range does not commit a half-range.
 * Clearing produces null. Controlled/default values and onValueChange follow
 * the other form controls. Native reset restores uncontrolled defaults.
 * Names submit date strings; range endpoints have separate caller-supplied
 * names. Formatting may follow locale; stored values never change timezone.
 * Min/max are inclusive. An optional unavailable-date predicate prevents those
 * days from being selected in the calendar. Calendar ranges cannot cross an
 * unavailable day. Typed reversed, out-of-bounds, or unavailable ranges/dates
 * remain editable, fail form validation, and show errors on blur/submission.
 * onValueChange represents complete input, not a guarantee of valid input.
 * Caller-provided values and bounds must be valid Gregorian date strings.
 * Each picker owns a required visible label, hint/error wiring, required,
 * disabled, and read-only states. Keyboard users can edit date segments, move
 * through calendar days and months, select, and dismiss back to the trigger.
 * No backend, application timezone, recurring schedule, time-of-day, or
 * server-side availability loading belongs to these controls.
 *
 * § MECHANICS
 * A headless date field/calendar owns segment editing, keyboard navigation,
 * overlay focus, and calendar arithmetic. Date objects stay behind the wrapper;
 * callers exchange strings. Each compound field owns its label rather than
 * asking a native label's for attribute to target a group of date segments.
 * Explicit display locales keep server and client segment order consistent.
 * The Gregorian calendar is explicit even when a locale defaults to another
 * calendar. Parsing never goes through a JavaScript Date or UTC midnight.
 * The range calendar's gap prevention does not validate typed interiors, so
 * the wrapper checks every included day when an availability predicate exists.
 * Reversed typed ranges must survive controlled-value round trips; ordering
 * belongs to field validation rather than the date parser.
 *
 * § PROVENANCE
 * Contract written before the Flover implementation, 2026-09-10. Tests in this
 * pass are implementation-aware, not an independent blind spec-test run.
 * Editable invalid-range semantics were clarified during integration checks.
 */
export {};
