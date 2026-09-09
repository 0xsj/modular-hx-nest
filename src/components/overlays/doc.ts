/**
 * overlays — the group where the behaviour IS the component.
 *
 * # Why this group is tested differently
 *
 * Everywhere else in the design system, what a component promises is visible
 * in one render: a role, an attribute, a class. Here the promises are about
 * what happens over TIME and across elements —
 *
 *     focus is trapped inside while it is open
 *     Escape closes it
 *     focus returns to the trigger that opened it
 *     the page behind does not scroll
 *     a press outside closes it (and for an alert dialog, does not)
 *
 * None of those can be seen in a snapshot, all of them break on refactor, and
 * every one of them is invisible to the person who broke it, because the
 * overlay still opens and still looks right.
 *
 * So this is the group that gets INTERACTION tests — open it, press a key,
 * assert where focus went — rather than the attribute assertions that are
 * enough elsewhere. That is not a new testing policy; it is the same rule
 * (`flover-solid ADR 0001`: components get unit tests) applied to components
 * whose unit of behaviour happens to be a sequence.
 *
 * # The library owns the hard part, and that is the point
 *
 * Focus trapping, dismiss layering, scroll locking, roving focus, typeahead
 * and portal ordering are solved problems with long tails, and the tail is
 * where the accessibility failures live: the trap that lets Tab escape into
 * the page behind, the restore that returns focus to `body`, the scroll lock
 * that shifts the layout by the scrollbar's width.
 *
 * Reimplementing any of it is how a component library ships a keyboard trap.
 * What these wrappers add is styling, the token contract, and the props that
 * make the accessible name impossible to omit.
 *
 * # Four surfaces that look alike and are not
 *
 *     Dialog       a task. Modal: the page behind is inert
 *     AlertDialog  a question that must be ANSWERED. No accidental dismissal
 *     Popover      more of the same page, positioned. Not modal, interactive
 *     Tooltip      a HINT about a control that already has a name
 *     Menu         a list of ACTIONS
 *
 * The distinctions that get lost, in the order they get lost:
 *
 * **A tooltip is not a label.** It cannot be one — see `tooltip/doc.ts`.
 *
 * **A popover is not a tooltip.** A tooltip has no interactive content,
 * because it closes on blur and on pointer-leave, so anything focusable inside
 * it cannot be reached.
 *
 * **A menu is not a select.** A menu performs; a select holds a value. They
 * are announced differently and the wrong one leaves a user waiting for a
 * change that already happened — the same argument `forms/select/doc.ts`
 * makes from the other side.
 *
 * # Everything is portalled
 *
 * Every content part renders through a portal, so an `overflow: hidden`
 * ancestor cannot clip it. That is the commonest way an overlay becomes
 * unusable inside a scrolling panel, and no z-index fixes it.
 *
 * The z ladder is deliberate and lives in `styles/tokens/z.css`: a popover
 * sits ABOVE a modal dialog, because a popover opened from inside one has to,
 * and content behind a modal is inert so it has nothing to compete with.
 */
export {};
