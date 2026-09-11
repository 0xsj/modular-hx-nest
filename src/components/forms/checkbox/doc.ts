/**
 * Checkbox — three states, and the third is not a styling of the other two.
 *
 *     checked         aria-checked="true"
 *     unchecked       aria-checked="false"
 *     indeterminate   aria-checked="mixed"     ← a real, announced third state
 *
 * The usual case is a parent checkbox over a partly-selected list. This template
 * has a second everywhere, because *found · looked for and absent · never looked
 * for* is the distinction the whole project refuses to collapse, and a checkbox
 * is one of the few controls that can express three states without inventing a
 * widget.
 *
 * Both glyphs live in the indicator and `data-state` decides which shows. A
 * `mixed` PROP would make it a variant, and it is a value: a variant is chosen
 * by the author, a state comes from the data.
 *
 * # The label is not in here
 *
 * A checkbox is sixteen pixels, and its hit area has to include the words. That
 * is a `Label` beside it with `htmlFor`, which makes the whole phrase clickable.
 * A `label` prop would make this component own an id, and then a caller who
 * wants two controls under one label cannot have it.
 *
 * # Deliberately absent
 *
 * A `CheckboxGroup`. The headless library has none, the platform has none, and
 * the grouping is a `Fieldset` with a `legend` — the same thing a radio group
 * needs, and already a component.
 */
export {};
