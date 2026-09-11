/**
 * Fieldset — the counterpart to `Field`, and the difference is where the wiring
 * goes.
 *
 * # One control receives its wiring; a GROUP keeps it
 *
 * `Field` hands its control an id, a description and a validity state, because
 * those attributes belong on the control. A group has no single control to hand
 * them to — a description that applied to one radio button of four would be
 * wrong three times — so they stay on the container, and the children are plain
 * nodes.
 *
 * That is the whole reason these are two components rather than one with a
 * flag. Getting it wrong is not a styling difference: a `<label>` naming four
 * radios names none of them, and a describedby on one of them is announced only
 * when that one is focused.
 *
 * # `<legend>` is not a heading that happens to look different
 *
 * It is the one element announced before EVERY control inside the group, which
 * is what makes "Notify me · by email / by SMS" comprehensible when a reader
 * reaches the third option. A styled `<p>` above the group reads as unrelated
 * text and the options arrive unattached to their question.
 *
 * # `min-inline-size: 0`
 *
 * A fieldset defaults to `min-content` in a way no other element does, so one
 * inside a grid refuses to shrink and pushes its column open. It is a platform
 * quirk rather than a design decision, and it is here so nobody rediscovers it.
 *
 * # The error goes AFTER the controls, the hint BEFORE
 *
 * A hint qualifies the question and belongs with it. An error is about what was
 * answered and belongs after the answer. Both are named in `aria-describedby`
 * with the error first, because a reader announces them in that order.
 */
export {};
