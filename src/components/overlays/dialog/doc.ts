/**
 * Dialog — a task that interrupts.
 *
 * # `title` is required
 *
 * A dialog with no accessible name is announced as "dialog" and nothing else:
 * a reader is told they have been moved somewhere and not told where. It is
 * the single most common dialog defect and it is invisible on screen, because
 * the heading is usually right there in the markup — just not WIRED, because
 * the library derives `aria-labelledby` from its own Title part and a
 * hand-rolled `<h2>` is not one.
 *
 * So the type demands it, and `titleHidden` exists for the case that motivates
 * omitting it — a dialog whose heading would be redundant on screen. Hidden is
 * not absent: the name survives.
 *
 * # `modal` is one prop and it decides four behaviours
 *
 * Measured from the library's own defaults:
 *
 *     modal: true (default)
 *       trapFocus                 true
 *       preventScroll             true
 *       closeOnInteractOutside    true
 *     modal: false
 *       all three                 false
 *
 * That coupling is right, and it is worth knowing rather than discovering: a
 * non-modal dialog does not trap focus, so Tab leaves it for the page behind,
 * and it does not lock scroll. If that is not what you wanted, you wanted a
 * `Popover`.
 *
 * `closeOnEscape` and `restoreFocus` are true regardless, and neither should
 * be turned off. Escape is the only dismissal a keyboard user can rely on, and
 * focus that is not restored lands on `body` — from which the next Tab starts
 * at the top of the document, somewhere the user has never been.
 *
 * # The content parts are bundled
 *
 * Portal, backdrop, positioner, content and title ship as one component rather
 * than five, because the failure modes of assembling them by hand all look
 * like styling problems: no portal and the dialog is clipped by an ancestor's
 * overflow; no backdrop and the modal does not read as modal; the positioner
 * omitted and the content is placed by whatever it happens to be inside.
 *
 * **The scroll is on the positioner, not the content.** A dialog taller than
 * the viewport must scroll as a whole box. Put the overflow on a centred child
 * and its top goes above the viewport where nothing can reach it — the bug
 * where a tall dialog's title is unreachable and its buttons are fine.
 *
 * # What it does not do
 *
 * **No nesting management.** Dialogs opening dialogs is a smell rather than a
 * feature: the second one has no room, and Escape becomes ambiguous.
 *
 * **No drawer variant.** A panel sliding from an edge shares the behaviour and
 * not the layout, and the difference is enough CSS that a variant would be two
 * components in one file.
 *
 * **No `open` default.** A dialog open on first paint is a page that should
 * have been a page.
 */
export {};
