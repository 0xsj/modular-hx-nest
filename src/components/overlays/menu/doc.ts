/**
 * Menu — a list of actions.
 *
 * # A menu performs; a select holds a value
 *
 * The counterpart of the argument in `forms/select/doc.ts`, from this side.
 * They look almost identical and are announced differently — `menu`/`menuitem`
 * against `combobox`/`listbox`/`option` — and the roles are a promise about
 * what pressing one does.
 *
 *     menu     the thing happens NOW. "Duplicate", "Export", "Delete"
 *     select   a value is chosen, and something else applies it later
 *
 * Choosing wrong leaves a user waiting for a change that already happened, or
 * pressing Save after a menu that already saved. The test: **is there
 * something to submit afterwards?**
 *
 * A menu is also not navigation. Items that go somewhere are links, and a menu
 * of links wants `NavLink` in a `nav` — see `navigation/tabs/doc.ts` for the
 * same test applied to tab strips.
 *
 * # The highlight is virtual focus, and the stylesheet has to say so
 *
 * DOM focus stays on the menu while the arrow keys move a highlight between
 * items; the library marks the current one with `data-highlighted`. Styling
 * `:hover` alone therefore leaves a keyboard user with no idea where they are
 * — the menu responds to the arrows and shows nothing.
 *
 * `[data-highlighted]` is the selector, and it is deliberately the same
 * attribute the library uses to compute `aria-activedescendant`, so the mark
 * and the announcement cannot disagree.
 *
 * # Typeahead is why this is not a list of buttons
 *
 * Typing letters jumps to the matching item, arrows wrap, Home and End go to
 * the ends, Escape closes and returns focus to the trigger. That contract is
 * the entire reason to use a menu primitive rather than a stack of buttons in
 * a popover — and it is a long tail that is wrong in every hand-rolled
 * version.
 *
 * # A labelled group is wired, not just drawn
 *
 * `MenuGroup` renders the library's group and label parts together, so the
 * label is associated with the items rather than being a heading that happens
 * to sit above them. A caller cannot get that pairing wrong because they never
 * see it as two things.
 *
 * # What it does not do
 *
 * **No icons-by-prop.** Items take children; the caller composes. A slot would
 * fix an order this component has no opinion about.
 *
 * **No nested submenus in this wrapper.** The library supports them; they need
 * their own decisions about open-on-hover delay and direction, and shipping
 * them untouched would mean shipping defaults nobody chose.
 *
 * **No checkbox or radio items yet.** They exist in the library and are a
 * different announcement — a menu that holds state is halfway to being a
 * select, and the decision above should be made deliberately.
 */
export {};
