/**
 * navigation — moving between places, and saying which place you are in.
 *
 * # Nothing here knows about routing
 *
 * `NavLink` takes `active` as a PROP rather than reading the current path.
 * Working it out needs a router, and a router is the one thing that differs
 * between this template and its two siblings — so the component stays portable
 * and the caller, which is framework-specific anyway, answers the question.
 *
 * The same argument as the composition root: a tier that fetches its own context
 * cannot leave the runtime it fetched it from.
 *
 * # Saying where you are is the whole job
 *
 * `aria-current="page"` is what all three of these exist to get right, and it is
 * the thing that gets forgotten. A nav whose active item is only a different
 * colour tells a reader nothing about where they are, and the defect is
 * invisible to whoever introduced it because the page looks correct.
 *
 * Both the link and the breadcrumb style themselves FROM that attribute rather
 * than from a class, so a thing cannot look current without saying it is.
 *
 * # The last crumb is not a link
 *
 * A link to the page you are already on is a control that does nothing: it is
 * offered, focused, activated, and nothing happens. The current page is a
 * `<span>` carrying `aria-current`, and the meaning is not lost — it was never
 * in the anchor.
 *
 * # Breadcrumb separators are markup, not generated content
 *
 * A `::before` with a slash in it is announced by some readers and not others,
 * which makes it untestable and inconsistent. A real element with `aria-hidden`
 * is neither.
 *
 * # Tabs: automatic activation, until a panel is expensive
 *
 * The primitive activates on arrow, which is the platform contract and what a
 * keyboard user expects. Switch to manual when showing a panel costs something —
 * a fetch, a chart — so travelling past four tabs costs one panel rather than
 * four. Automatic is the right default and the wrong one for a dashboard.
 *
 * Like a radio group, the list is ONE tab stop with arrows inside it. That is
 * the contract a hand-rolled tab strip almost always misses.
 */
export {};
