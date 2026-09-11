/**
 * overlays — content that appears over the page, and the four obligations that
 * come with it.
 *
 * `decisions/0001-spec-tests-start-at-business-logic` names this as the one
 * group committed to interaction tests, because these four break silently on
 * refactor and are invisible to whoever broke them:
 *
 *     focus moves INTO the overlay when it opens
 *     focus is TRAPPED while it is open
 *     Escape closes it
 *     focus is RESTORED to the trigger on close
 *
 * A localized caller passes lang and dir to portal content explicitly: it no
 * longer inherits the preview region's DOM ancestors. The shared panel uses
 * logical positioning and reverses its horizontal translation in RTL so the
 * same center anchor works in either direction.
 *
 * All four are asserted, plus the scroll lock and the page behind going inert.
 *
 * # The accessible name is a required PROP
 *
 * `title` on a dialog's content is required and is not a child. A dialog with
 * no name is announced as "dialog" and nothing else — the commonest defect in
 * this component, and one a visual review cannot see. Making it a prop turns it
 * from a thing you remember into a thing that does not typecheck.
 *
 * `hideTitle` exists for a design that names the dialog around it. The title is
 * still announced; there is no way to omit one.
 *
 * # Dialog and AlertDialog are different promises
 *
 *     Dialog        dismissible. Outside click, Escape, a close button.
 *     AlertDialog   requires a CHOICE. No outside dismissal, no close button,
 *                   and `description` is required rather than optional —
 *                   a question you cannot look away from has to say what it asks.
 *
 * Focus lands on the CANCEL, never the destructive action. A confirmation whose
 * default is "yes" is a confirmation that confirms itself.
 *
 * # Popover, Tooltip and DropdownMenu are three things
 *
 *     Tooltip   a supplementary hint for something that ALREADY has a name.
 *               Unreachable by touch, and by anyone who does not hover — so it
 *               may never carry the only copy of anything.
 *     Popover   focusable, dismissible, may contain controls.
 *     Menu      a list of ACTIONS. No current value, nothing submitted,
 *               and reopening shows the same list. See the select's doc for
 *               the other half of that distinction.
 *
 * Putting controls in a tooltip makes them unreachable; putting a hint in a
 * popover makes it a click away from a reader who needed it in passing.
 *
 * # Highlight follows `data-highlighted`, not `:hover`
 *
 * The primitives set it for pointer AND keyboard. A `:hover` rule alone leaves
 * a keyboard user with no idea where they are in a menu, which is invisible to
 * anybody testing with a mouse.
 *
 * # One elevated surface
 *
 * Everything that floats shares `components/surface.module.css`, so four
 * overlays cannot drift into four shadows and three border colours.
 */
export {};
