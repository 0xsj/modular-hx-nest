/**
 * Slider — choosing one numeric value within a range.
 *
 * § CONTRACT
 * A label is required. The value may be controlled or uncontrolled. Min, max,
 * step, disabled, name, and value-commit callbacks are passed to the control.
 * Arrow keys adjust one step; Home/End select the bounds. The disabled control
 * is removed from keyboard interaction. A visible value is the caller's job.
 *
 * § MECHANICS
 * This first component has one thumb. Radix owns input and keyboard behavior;
 * the API uses a number and adapts to the primitive's single-element array.
 */
export {};
