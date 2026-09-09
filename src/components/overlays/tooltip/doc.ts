/**
 * Tooltip — a hint about a control that already has a name.
 *
 * # A tooltip is not a label, and cannot be made into one
 *
 * The rule this component exists to state. An icon-only button with a tooltip
 * and no `aria-label` is an unlabelled button, and the tooltip does not fix it
 * for anyone:
 *
 *     touch          there is no hover. The tip never appears
 *     screen reader   the name is read from the button, which has none
 *     keyboard        focus shows the tip, but only once you are already there
 *
 * The tooltip is the SECOND channel. The first is the control's own accessible
 * name, and it is not optional because the second exists. This is why the
 * button primitive demands an `aria-label` on its icon branch as a type error
 * rather than trusting a tooltip to be added.
 *
 * The corollary: if the tooltip says the same words as the label, it is noise
 * for everyone who has both. A tooltip earns its place by saying something the
 * name does not — a keyboard shortcut, a unit, a constraint.
 *
 * # No interactive content. Ever.
 *
 * A tooltip closes on blur and on pointer-leave, so anything focusable inside
 * it cannot be reached: tab to it and the tip is gone before focus arrives;
 * move the pointer toward it and you leave the trigger on the way. A link in a
 * tooltip is a link nobody can click.
 *
 * The content is `pointer-events: none` for the same reason from the other
 * side — a tip under the cursor re-triggers the trigger's own leave, and the
 * result is a tooltip that flickers.
 *
 * If it needs a button, a link, or selectable text, it is a `Popover`.
 *
 * # It does not exist on touch
 *
 * There is no hover on a touch screen, and long-press is the platform's text
 * selection or context menu. Anything a tooltip is the only carrier of is
 * unavailable to most of the people using the product on a phone — which is
 * another way of stating the first rule.
 *
 * # What it does not do
 *
 * **No `title` attribute fallback.** The native tooltip is unstyleable,
 * delayed by hundreds of milliseconds, invisible to touch, and announced
 * inconsistently — and having both produces two tips at once.
 *
 * **No click-to-open.** A tip that has to be pressed is a popover with a
 * disguise, and the disguise means it will not be given the accessible name a
 * popover needs.
 */
export {};
