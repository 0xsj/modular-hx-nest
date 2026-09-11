/**
 * RadioGroup — one of several, and the group owns the value.
 *
 * # What it does NOT own is the question
 *
 * A radio group needs a name announced before every option — "Notify me · by
 * email" makes sense at the third option only if the question is repeated. That
 * is a `<legend>`, which means a `Fieldset` around this, not a prop here.
 *
 * Putting the question on the group as a `label` prop would produce an
 * `aria-label` on the container, which is announced once on entry and never
 * again. It reads fine in a test and badly in use.
 *
 * # Arrow keys, not tab
 *
 * The platform's contract for a radio group is that Tab enters and leaves the
 * whole group and arrows move within it — one tab stop, not one per option. The
 * headless primitive implements it; it is written down here because a
 * hand-rolled group almost always gets it wrong in the same direction, and a
 * form with fifteen options then costs fifteen tab presses to pass.
 *
 * # Deliberately absent
 *
 * An indeterminate state. Radio groups have none: "no answer yet" is the group
 * having no value, which is already representable.
 */
export {};
