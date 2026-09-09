/**
 * ThemeToggle — the three theme states, over `lib/runtime`.
 *
 * # Three, and `system` is the default
 *
 * The full argument is in the group's `doc.ts`. The part that belongs here:
 * this control must offer three options, because a two-state toggle silently
 * converts "follow the platform" into "whatever I was showing when you pressed
 * me" — and there is then no way back to following it.
 *
 * `system` being the DEFAULT and a real selection is what makes the difference
 * observable: a user who has never touched this gets the OS preference, and a
 * user who has can return to it.
 *
 * # It holds nothing
 *
 * The store in `lib/runtime` is the source. Two of these on one page agree
 * because neither of them is the answer — and the preference persists across
 * reloads because persistence is the store's job, not the control's.
 *
 * # Why it is not in `forms`
 *
 * It applies on press and there is nothing to submit, so it is not a form
 * field. It is also product furniture rather than content, which is the test
 * `chrome/doc.ts` gives: a different product using this template replaces the
 * mark and keeps the button.
 */
export {};
