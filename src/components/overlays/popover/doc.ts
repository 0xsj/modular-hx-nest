/**
 * Popover — more of the same page, positioned.
 *
 * # It is not a tooltip and not a dialog
 *
 *     tooltip   a hint. No focusable content, closes on blur and leave
 *     popover   THIS. Interactive, dismissible, and the page stays live
 *     dialog    a task. Modal: focus trapped, page behind inert
 *
 * The distinction from a tooltip is about REACHABILITY: a popover's content
 * can be tabbed into and clicked, which a tooltip's cannot, because a tooltip
 * disappears on the way there.
 *
 * The distinction from a dialog is about interruption. A popover does not trap
 * focus and does not lock scroll — the page behind stays usable, which is what
 * makes it right for a filter panel, a detail card, a small form, and wrong
 * for anything the user must finish before continuing.
 *
 * # `title` is required, same as the dialog's
 *
 * A popover is a labelled group in the accessibility tree; without a name it
 * is announced as an unnamed one, which tells a reader that something opened
 * and not what. `titleHidden` covers the case where the heading would be
 * redundant on screen — hidden, not absent.
 *
 * # Portalled, always
 *
 * Rendered through a portal so an `overflow: hidden` ancestor cannot clip it.
 * That is the commonest way a popover becomes unusable inside a scrolling
 * panel, and it is not a z-index problem — a clipped element cannot be
 * un-clipped by stacking.
 *
 * It sits above a modal dialog in the z ladder on purpose: a popover opened
 * from inside one has to be, and content behind a modal is inert so there is
 * nothing for it to obscure wrongly.
 *
 * # What it does not do
 *
 * **No modal mode.** A popover that traps focus is a dialog, and the two names
 * for one behaviour is how a codebase ends up with both and a rule about
 * which.
 *
 * **No hover trigger.** Opening on hover makes the content unreachable for the
 * same reason a tooltip's is, and it fires on the way past for a pointer that
 * was going somewhere else.
 */
export {};
