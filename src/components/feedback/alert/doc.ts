/**
 * Alert — a message about something that happened.
 *
 * # `live` is absent by default, and that is the whole design
 *
 * A live region is a promise that its contents are NEW. Most alerts are not:
 * they render with the page, as part of it, and a reader meets them in
 * document order like any other prose. Marking those as live costs something
 * and buys nothing —
 *
 *     absent        a styled region, read in document order
 *     "polite"      announced when the reader finishes its sentence
 *     "assertive"   interrupts. For something that must be acted on NOW
 *
 * — because an assertive region that is always present trains a user to ignore
 * the one that matters, and a polite one that was there at load announces
 * nothing anyway. The default is therefore off, and turning it on is a
 * statement that this alert ARRIVED.
 *
 * # The trap: a live region must exist before the thing it announces
 *
 * Assistive technology watches regions that are in the accessibility tree. A
 * region that is mounted at the same moment as its message frequently
 * announces nothing at all, because there was nothing to watch when the change
 * happened.
 *
 * So `{error && <Alert live="assertive">{error}</Alert>}` — the obvious
 * spelling, the one everybody writes — is the spelling that silently does not
 * work. The container has to be rendered empty and filled later:
 *
 *     <div role="alert">{error}</div>      mounted always, populated on error
 *
 * That is a decision about where the region LIVES, which is a screen's to
 * make, not this component's. What this component can do is not pretend: it
 * carries the role when asked and documents the condition under which the role
 * does its job.
 *
 * # role, not aria-live
 *
 * `role="alert"` implies `aria-live="assertive"` and `aria-atomic="true"`;
 * `role="status"` implies the polite pair. Setting both the role and the
 * attributes is redundant, and the atomic half is the part people miss when
 * they reach for `aria-live` alone — without it a reader announces the DIFF
 * rather than the message, so a changed word arrives with no sentence around
 * it.
 *
 * # Tone is not carried by colour alone
 *
 * The same argument as the badge's, one component along. Each tone has a
 * glyph, and the two tones where missing the distinction changes what you DO —
 * `warn` and `crit` — additionally contribute a visually-hidden word, inside
 * the region so it is announced with the message rather than as a stray one.
 *
 * `info` and `accent` get no spoken prefix. "Info: your export is ready" adds
 * a syllable and no fact; the sentence already carries its own weight. A
 * prefix on every tone is how a convention becomes noise and then gets
 * removed entirely.
 *
 * **The body text is not tinted.** The border, the fill and the glyph have
 * already said which tone this is, and red body copy is measurably harder to
 * read than the same copy in ink.
 *
 * # Dismissal is the caller's
 *
 * No `onDismiss`, no button. The component never manufactures the handler and
 * never owns the visibility — a primitive that hides itself has taken a
 * decision about state that its caller cannot then undo, and an alert that
 * vanishes is unrecoverable.
 *
 * The button is a real `button` with an accessible name, defaulting to
 * "Dismiss". It is dimmed rather than hidden-until-hover: a control that
 * appears on hover cannot be found by anyone not using a pointer, and cannot
 * be found at all on a touch screen.
 *
 * # What it does not do
 *
 * **It is not a toast.** A message that appears in a corner and leaves on a
 * timer needs a stack, a queue, positioning, and a timeout that pauses on
 * focus and hover. That is a screen-level service and belongs to the overlay
 * group with its own portal.
 *
 * **It does not render a failure's `message`.** That field is diagnostic. The
 * sentence in an alert is the product's voice, and it comes from an exhaustive
 * switch over `kind` at the call site.
 */
export {};
