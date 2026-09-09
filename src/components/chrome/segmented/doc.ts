/**
 * Segmented — one of a small set, chosen immediately.
 *
 * # Radios, not a row of toggle buttons
 *
 * The tempting implementation is three buttons with `aria-pressed`, one of
 * them true. It looks identical and says something different: `aria-pressed`
 * describes each button independently, so a reader is told about three
 * separate two-state controls that happen to be adjacent. Nothing states that
 * they are alternatives, or that exactly one is chosen, or how many there are.
 *
 * Radio semantics say all three. The set is one tab stop, the arrows move
 * within it, and a reader announces "2 of 3". That contract is also the reason
 * to use the library rather than write it: roving tabindex is easy to get
 * wrong and the failure is a keyboard trap.
 *
 * # It is not a form field
 *
 * A segmented control applies on press. If the choice needs a Save, it is a
 * `RadioGroup` in a form — the same distinction the switch and the checkbox
 * make one group over.
 *
 * # The label names the SET, and is required
 *
 * An unlabelled group of radios is announced as a run of loose options with no
 * statement of what is being chosen — "Light, radio button, 2 of 3" and no
 * word about theme. `labelHidden` covers the case where the surrounding UI
 * makes it obvious to the eye; the name survives.
 *
 * # The focus ring is on the item, not the input
 *
 * The real input is visually hidden, so its own focus ring is invisible. The
 * item carries the ring through `:has(:focus-visible)`, which keeps the ring
 * tied to actual focus rather than to a class somebody has to remember to
 * apply — and means the control is never operable-but-invisible.
 *
 * # A cleared selection is not a state this has
 *
 * The library reports `null` when a selection is cleared. These sets always
 * have exactly one member selected, so the null is dropped rather than
 * widening the callback's type to a case no caller can produce — a state
 * modelled and never reached is one that will be wrong when something finally
 * reaches it.
 */
export {};
