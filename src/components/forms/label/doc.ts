/**
 * Label — a thin wrapper, and the only file that imports the headless label.
 *
 * It exists for two reasons and neither is styling. It is the single place the
 * library is named, per the stack rule; and the primitive adds click-to-focus
 * for controls the platform does not associate natively, which is behaviour
 * worth having exactly once rather than remembered per form.
 *
 * `Field` uses it internally, so a tree has one labelling implementation even
 * where a caller reaches for the standalone.
 */
export {};
