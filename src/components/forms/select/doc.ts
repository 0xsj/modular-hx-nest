/**
 * Select — a value bound to a form. The third of the three that look identical.
 *
 * # Select, a menu, and a popover
 *
 *     Select     a VALUE. Announced as a combobox, has a name, submits
 *     Menu       ACTIONS. Its items are commands and nothing holds a value
 *     Popover    ARBITRARY content, including inputs
 *
 * Using a menu where a value belongs is the most common of the three mistakes:
 * the options are announced as commands and there is nothing for a form to
 * send.
 *
 * # Why not a native `<select>`
 *
 * A native select cannot be styled inside — no icons, no two-line options, no
 * grouping that matches the rest of the system — and its popup is drawn by the
 * operating system, so it ignores the theme entirely.
 *
 * The cost is real and worth naming: it is not a real `<select>`, so a
 * browser's native mobile picker is gone, and it needs JavaScript to open. A
 * form that must work without JS wants the native element.
 *
 * The hidden select is what keeps the form half: without it this is a styled
 * div that submits nothing.
 *
 * # The list is positioned in a portal, and that is not optional
 *
 * A list rendered in place inherits its ancestors' `overflow` and `transform`.
 * Inside a scrolling panel it is clipped; inside anything with a transform it
 * is displaced, because a transform creates a containing block no `z-index`
 * escapes. Both are bugs a caller finds late and diagnoses as something else,
 * so the portal is part of the component rather than left to the call site.
 *
 * # `data-highlighted`, never `:hover`
 *
 * The library drives pointer and keyboard through one attribute, so exactly one
 * item is lit at a time. Styling `:hover` instead produces the classic
 * two-cursor bug: the keyboard cursor on one item and the mouse highlight on
 * another, with Enter activating the one that is not under the pointer.
 *
 * # The list is never narrower than its trigger
 *
 * A value that appears to change width when the menu opens reads as two
 * different controls rather than as one expanding.
 *
 * # Deliberately absent
 *
 * **Groups, and scroll buttons.** The library has them; no list here is long
 * enough to scroll or heterogeneous enough to group, and both arrive with the
 * screen that needs them.
 *
 * **A multiple variant.** Multi-select is a different control with a different
 * keyboard model and a different empty state, not a boolean on this one.
 */
export {};
