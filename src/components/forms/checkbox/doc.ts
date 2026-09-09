/**
 * Checkbox — three states, and the third is not a styling of the other two.
 *
 *     checked         announced "checked"
 *     unchecked       announced "not checked"
 *     indeterminate   announced "mixed"   <- a real, announced third state
 *
 * The usual case is a parent checkbox over a partly-selected list. The
 * indicator holds both glyphs and the library's `data-state` decides which
 * shows.
 *
 * # Where the third state actually lives
 *
 * Not in `aria-checked`. The control is a real `input type="checkbox"`, so the
 * accessibility tree reads the native `checked` and `indeterminate`
 * PROPERTIES, and `aria-checked` on a native checkbox is prohibited by ARIA in
 * HTML. `indeterminate` is the awkward one: it has no attribute form, so it
 * cannot be rendered — it can only be assigned to the element.
 *
 * The library syncs it when the value CHANGES but not when it mounts, so a
 * checkbox rendered indeterminate drew the dash and announced "not checked".
 * A state that is visible and unannounced is the failure this whole section
 * exists to prevent, so the component assigns the property itself, from the
 * live api rather than the prop so an uncontrolled checkbox is covered too. A `mixed` PROP would make it a variant, and it is a value — the
 * difference matters because a variant is chosen by the author and a state
 * comes from the data.
 *
 * # The label is not in here
 *
 * A checkbox is 16px and its clickable area has to include the words. That is a
 * `Label` beside it with `for`, which also makes the whole phrase a hit target.
 * Bundling a `label` prop would make this component own an id, and then a
 * caller that wants two controls under one label cannot have it.
 *
 * # A hidden input, because a checkbox is a form value
 *
 * The library renders one so the control submits with a native form and can be
 * read by anything that reads a form. A styled div that only holds state in
 * memory is the version that works until somebody submits.
 *
 * # Deliberately absent
 *
 * **A CheckboxGroup.** The grouping is a `Fieldset` with a legend — which is
 * the same thing a radio group needs and is already a component.
 *
 * **A size variant.** Every checkbox in a form is one size. A second size is a
 * real decision about density and should arrive with the screen that needs it.
 */
export {};
