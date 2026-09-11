/**
 * Toggle — a button that stays pressed.
 *
 * It reports `aria-pressed`, which is what makes it a toggle rather than a
 * button that happens to look different when active. See `../switch/doc.ts` for
 * why it is not a Switch and not a Checkbox.
 *
 * Its job is a VIEW: bold in an editor, a filter that is on, a panel that is
 * shown. Nothing it does is submitted and nothing it does is a setting.
 *
 * # Pressed is a state, not a class
 *
 * The styling keys off `data-state="on"` rather than a prop a caller sets. A
 * control that looks pressed without reporting it is the silent-wiring-loss this
 * system is built to avoid, and the two cannot drift when only one of them
 * exists.
 *
 * # `size="icon"` needs a name
 *
 * The same rule as the button's icon size: a toggle rendering only a glyph has
 * nothing for a reader to announce. Unlike the button this is not enforced by
 * the type — the headless primitive's props are spread through — so it is a
 * review point rather than a compile error, and saying so is better than
 * implying the type covers it.
 */
export {};
