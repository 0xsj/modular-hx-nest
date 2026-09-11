/**
 * display — what a screen shows when it is not asking for anything.
 *
 * # This is where the three-states rule is lost, so three components defend it
 *
 * `Presence` renders the kernel's three states and exists so that
 * `value ? x : "–"` cannot be written at a call site. That ternary collapses
 * *looked and found nothing* into *never checked* at the last possible moment,
 * after every tier below has kept them apart.
 *
 * `Stat` treats `undefined` as *nobody measured* and renders `–`, never `0`. A
 * zero is a measurement; a screen showing one for an unmeasured total asserts
 * something nobody checked.
 *
 * `Empty` is a successful answer and is styled as one. Rendering an empty list
 * in error styling teaches people to read a working system as broken.
 *
 * # `PRESENCE_MEANING` is defined once
 *
 * A cell, a legend and a screen reader describing "never checked" in three
 * slightly different ways is the distinction being lost in the copy rather than
 * in the data, which is harder to notice and just as final.
 *
 * # Table is compositional, not data-driven
 *
 * A table taking `columns` and `rows` grows a renderer prop the moment one cell
 * is not a string, and each one re-invents markup the platform already has.
 * Composition costs a few lines per call site and never runs out.
 */
export {};
