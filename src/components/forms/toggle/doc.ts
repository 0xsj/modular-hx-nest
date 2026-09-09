/**
 * Toggle — a button that stays pressed. Not a switch, and not a checkbox.
 *
 * # What it is for
 *
 * A view or a mode, never data. A filter chip, a formatting mark, a theme
 * choice. `aria-pressed`, which says *this control is currently on* rather than
 * *this setting has a value*.
 *
 *     Toggle     a button. aria-pressed. Changes what you SEE
 *     Switch     role="switch". Changes what the SYSTEM does, immediately
 *     Checkbox   role="checkbox". A value in a form, applied on submit
 *
 * # Styled on `aria-pressed`, not `data-state`
 *
 * The library writes both and both are correct. But `data-state` is written by
 * EVERY primitive in it, so a Toggle used as another primitive's trigger has
 * that primitive's `open`/`closed` merged onto the same element and the pressed
 * rule silently stops matching. The control still announces itself correctly
 * and just never looks pressed.
 *
 * `aria-pressed` is this component's own attribute, is equally driven by
 * pointer and keyboard, and cannot collide — which is what makes a Toggle
 * composable inside any other trigger.
 *
 * # Two axes, and `shape` is not decoration
 *
 * `size` is sm | md | icon; `shape` is square | pill. That is a real difference
 * between *one of a set of filters* and *one of a set of modes*, and both read
 * differently at a glance.
 *
 * # Deliberately absent
 *
 * **A ToggleGroup.** It enforces single or multiple selection across a set with
 * roving focus. That is a real thing and a different component; it arrives when
 * something wants exclusive selection, and until then it would add a roving tab
 * stop and a selection model no caller wants.
 */
export {};
