/**
 * Select — a value bound to a form. NOT a menu.
 *
 * # The distinction is the whole reason this is a separate component
 *
 *     Select   picks a VALUE. It has a current one, it is submitted, and
 *              reopening it shows what is chosen.
 *     Menu     picks an ACTION. It has no value, nothing is submitted, and
 *              reopening it shows the same list every time.
 *
 * They look nearly identical and are announced completely differently — one as
 * a combobox with a value, the other as a menu of commands. Using a menu for a
 * value leaves a reader unable to discover what is currently selected, and
 * using a select for actions announces a "current action", which is nonsense.
 *
 * # The list is portalled
 *
 * Otherwise an `overflow: hidden` ancestor clips it, which is the commonest way
 * a select becomes unusable inside a scrolling panel. The cost is that it leaves
 * the DOM position of its trigger, which matters only if something is styling by
 * descent — and nothing here does, because styling is by module.
 *
 * # Highlight follows `data-highlighted`, not `:hover`
 *
 * The primitive sets that attribute for pointer AND keyboard. Styling `:hover`
 * alone leaves a keyboard user with no indication of where they are in the list,
 * which is invisible to anyone testing with a mouse.
 *
 * # Width comes from the trigger
 *
 * `--radix-select-trigger-width` as a minimum, so the list cannot be narrower
 * than the thing that opened it. A list that is wider is fine; one that is
 * narrower reads as a different control.
 *
 * # Deliberately absent
 *
 * A native `<select>` fallback. The two cannot be styled to match, and shipping
 * both means every screen has two appearances depending on a decision nobody
 * documented.
 */
export {};
