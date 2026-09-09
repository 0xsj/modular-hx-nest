/**
 * Stat — one measurement, labelled.
 *
 * # The whole component exists for the third state
 *
 * A number on a dashboard has three cases, and the usual implementation has
 * two:
 *
 *     42          measured, and it is 42
 *     0           measured, and it is zero
 *     undefined   NOBODY LOOKED
 *
 * The failure is rendering the third as the second. "0 open incidents" is a
 * claim; an unmeasured total is the absence of one, and a screen that prints
 * `0` for a request that failed has invented a reassuring fact at the exact
 * moment it had none. This is the `Three states, not two` rule of `CLAUDE.md`
 * at the point it reaches a pixel, and it is the counterpart of
 * `lib/kernel`'s `Presence` on the render side.
 *
 * So `value` is optional and `undefined` is meaningful rather than a default.
 * `value ?? 0` anywhere upstream is the bug this component cannot prevent,
 * which is why the type makes the absence travel this far.
 *
 * # The dash is drawn, and the words are announced
 *
 * An en dash is the convention, and it is silent: a reader announces "dash",
 * or nothing. Either way the one user who most needs to be told that a figure
 * is missing is the one who is not told.
 *
 * So the glyph is `aria-hidden` and the fact is carried in visually-hidden
 * text — "not measured". Both channels say the same thing, which is the same
 * rule the badge follows for colour.
 *
 * An EN dash specifically: a hyphen is a word-joiner and gets read as one, and
 * a minus sign belongs to a number that exists.
 *
 * # Tabular figures are not a preference here
 *
 * A row of stats with proportional digits does not line up, and a value that
 * updates changes width as it does, which reads as a rendering glitch rather
 * than as new data. Digit alignment is what makes a column of numbers
 * comparable at a glance, and comparison is the only reason to put them in a
 * row.
 *
 * # What it does not do
 *
 * **No delta, no sparkline, no trend arrow.** A change needs a baseline, a
 * direction, and a statement about whether up is good — three facts this
 * component does not have and would have to guess at. They belong to a
 * component that takes them.
 *
 * **No formatting.** The caller passes a string or a number, already rounded
 * and already localised. Formatting inside would need a locale, a unit and a
 * precision, and would quietly disagree with every other number on the screen.
 *
 * **No loading state.** "Loading" is not "unmeasured" — one resolves and the
 * other has resolved. Conflating them is how a permanent failure renders as a
 * spinner nobody investigates.
 */
export {};
