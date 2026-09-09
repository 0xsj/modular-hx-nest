/**
 * Tabs — one panel at a time, within a page.
 *
 * # Tabs that change the URL are links wearing a costume
 *
 * This is the decision this component exists to force, and it is made wrongly
 * more often than any other in this group. The test:
 *
 *     does pressing it change the URL?
 *       yes -> they are LINKS. Use NavLink in a `nav`.
 *       no  -> they are tabs
 *
 * The two are indistinguishable on screen and completely different underneath.
 * A tab is `role="tab"` in a `tablist`, controlling a `tabpanel` that is part
 * of this page; the browser's back button does nothing, because nothing was
 * navigated. Links change the address, are bookmarkable, are openable in a new
 * tab, and are announced as links.
 *
 * Building route navigation out of tabs produces a page where the back button
 * is broken and middle-click does nothing — behaviours users do not report as
 * bugs, they just stop using them. Building in-page panels out of links
 * produces a URL that changes for something the user does not think of as a
 * different place.
 *
 * # The keyboard contract is the reason to use a library here
 *
 * A tablist is one tab stop, and the arrow keys move within it — the same
 * roving-tabindex model as a radio group. Home and End jump to the ends.
 * Getting there by hand means managing `tabindex` on every trigger as the
 * selection moves, and the failure mode is a keyboard trap or a control that
 * cannot be reached at all.
 *
 * This is exactly the long tail the headless library is for, and reimplementing
 * it is how a component library ships a keyboard trap.
 *
 * # Activation mode is a real choice
 *
 * Automatic — focus selects — is the default and is right when the panels are
 * already rendered: arrowing through them shows each as you pass. Manual
 * requires Enter or Space to select, and is right when selecting is expensive,
 * because automatic activation fires a request per arrow key on the way to the
 * tab somebody actually wanted.
 *
 * The library takes `activationMode` and this passes it through. There is no
 * default worth overriding here; what matters is that the choice exists and is
 * about cost, not taste.
 *
 * # The stylesheet keys off the library's state attribute
 *
 * `[data-selected]`, not a class. Same reasoning as the nav link's: the
 * selected look and `aria-selected` are then the same condition rather than
 * two copies that can drift.
 *
 * The indicator is decorative and adds nothing to the accessibility tree — it
 * is `aria-selected` drawn. It follows the selected tab rather than being one
 * border per tab so the movement reads as one thing moving.
 *
 * # What it does not do
 *
 * **No lazy panels.** Whether a panel's contents are fetched on first
 * selection is a data decision, and the component that owns it is the one
 * inside the panel.
 *
 * **No closable or addable tabs.** That is a different component with its own
 * focus-management problem — where does focus go when the selected tab is the
 * one removed — and answering it by accident is worse than not offering it.
 *
 * **The list scrolls rather than wraps.** Wrapped tabs put the indicator on a
 * different line from the tab it marks, and a second row of tabs reads as a
 * second, subordinate group.
 */
export {};
