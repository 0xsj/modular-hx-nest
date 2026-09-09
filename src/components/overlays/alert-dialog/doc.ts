/**
 * AlertDialog — a question that has to be answered.
 *
 * # It is one prop, and the library derives three behaviours from it
 *
 * Setting `role="alertdialog"` is not a relabelling. Measured, from the
 * library's own prop resolution:
 *
 *     closeOnInteractOutside   modal && !alertDialog   -> FALSE
 *     initialFocusEl           the close trigger       -> the safe answer
 *     closeOnEscape            true                    -> unchanged
 *
 * So it stops being dismissible by a stray press on the page behind, and focus
 * lands on the way OUT rather than on the way through. Both are what
 * "cannot be dismissed by accident" actually means.
 *
 * # Why it is a separate export rather than a documented prop
 *
 * Because a caller who has to remember the prop will forget it, and the
 * failure is a destructive confirmation that closes when somebody clicks the
 * page behind it — losing the question, and leaving them unsure whether the
 * thing happened. A named component makes the intent the thing you type.
 *
 * # Focus lands on the cancel action, so make cancel the close trigger
 *
 * The library focuses the close trigger on open. In an alert dialog that
 * should be the harmless answer — Cancel, Keep, Go back — so that Enter on a
 * dialog somebody has not read does nothing.
 *
 * This is why the content takes `cancel` and `confirm` as separate props
 * rather than a single `footer`: the two are not interchangeable, and a shape
 * that lets them be swapped is a shape where Enter deletes the account.
 *
 * # There is no ✕, and Escape still works
 *
 * The corner cross is removed because an alert dialog asks a question and a
 * cross is an answer nobody chose — it reads as "cancel" to some people and
 * "not now" to others.
 *
 * Escape stays, and should: it is a deliberate act by a person who knows what
 * they are doing, unlike a stray click on a backdrop. Removing it would leave
 * a keyboard user with no dismissal at all, which fails the guidance this
 * component exists to satisfy rather than serving it.
 *
 * # When to reach for it
 *
 * Irreversible, or expensive to reverse. Deleting, revoking, sending,
 * overwriting. Everything else is a `Dialog` — a confirmation on a harmless
 * action is a click tax that trains people to confirm without reading, which
 * is what makes the important one fail.
 */
export {};
