/**
 * RadioGroup — one choice from a closed set, with the set named.
 *
 * # It is incomplete without a Fieldset
 *
 * The group has `role="radiogroup"`, and that role has no name of its own. A
 * `<legend>` inside a `<fieldset>` is announced before **every** option, so a
 * screen reader says *"Claimant, rule, radio button, 1 of 3"* rather than
 * *"rule, radio button, 1 of 3"* — which is the difference between a choice and
 * a word.
 *
 * That is why `Fieldset` exists. Neither is much use alone.
 *
 * # The arrow-key behaviour is the reason not to hand-roll
 *
 * Radios are a single tab stop with arrow keys moving *and selecting* inside
 * it — roving tabindex. Native radios do this and a set of hand-rolled buttons
 * does not, which is the usual regression.
 *
 * # `Radio`, not `RadioGroupItem`
 *
 * The library's name is longer than the thing it describes, and a radio outside
 * a group is not a thing — so the shorter name is not ambiguous.
 *
 * # Deliberately absent
 *
 * **A `label` prop on `Radio`.** The option's label is its child, rendered
 * inside the item, which makes the words part of the hit target. A prop would
 * be the same thing with less control over what goes in it.
 */
export {};
