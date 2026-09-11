/**
 * feedback — messages about the page rather than about a field.
 *
 * A field's error belongs to its Field, which owns the wiring that connects it
 * to a control. Anything wider than one input belongs here.
 *
 * # `live` is absent by default, and that is the decision
 *
 * A live region announces its contents when they CHANGE. Most alerts are
 * rendered with the page, so a live role on them announces nothing at load —
 * and then, having spent the role, announces every later re-render as though it
 * were news.
 *
 *     absent      a styled region, read in document order like any prose
 *     "polite"    announced when the reader finishes its current sentence
 *     "assertive" INTERRUPTS. Reserved for something that must be acted on now
 *
 * `assertive` is the one to be careful with: it cuts a reader off mid-sentence,
 * and a page that does that for a saved-successfully message has taught its
 * user to resent it. The rule of thumb is that if a sighted user would not be
 * shown a modal, the message is not assertive.
 *
 * # A skeleton is hidden and the region is busy
 *
 * A skeleton carries no information, so it is `aria-hidden` — a reader hearing
 * "loading" ten times from ten placeholders is worse off than one hearing
 * nothing. The busy state goes on the REGION as `aria-busy`, which is one
 * announcement instead of ten and is what a reader actually needs.
 *
 * This is the same shape as a decorative icon: the visual thing is hidden and
 * the meaning is carried once, somewhere a reader will encounter it.
 *
 * # A skeleton is sized to what is coming
 *
 * A generic grey box is a spinner with extra steps. The value of a skeleton is
 * that the layout does not move when the content lands, which requires it to be
 * the shape of the content — hence a default of filling its container, and a
 * text variant whose last line is short because real paragraphs end mid-line.
 *
 * # Motion is not carrying the meaning
 *
 * The reset flattens animation under a reduced-motion preference, so the shimmer
 * stops. What remains is the colour difference, which is what says "not yet" —
 * a skeleton that depends on movement to be legible has put the message in the
 * one channel some people have switched off.
 */
export {};
