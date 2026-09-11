/**
 * shells — the frames a whole screen sits inside, and the first group that is a
 * COMPOSITE rather than a primitive.
 *
 * Every other group answers "what is this control". These answer "what is this
 * page", which is a different kind of question and has a different failure
 * mode: a shell that gets it wrong is wrong on every screen at once.
 *
 * # Slots, not configuration
 *
 * `AppShell` takes `nav`, `actions` and `brand` as nodes. One that took
 * `navItems`, `userName` and `showSearch` would be a bet that those are the
 * only things that vary, and the bet is lost the first time an item needs a
 * badge — at which point the props grow rather than the composition.
 *
 * The exception is `SidebarNav`, which takes items as DATA, because a
 * navigation genuinely is a list of links and a product editing one file beats
 * a product hunting links through markup.
 *
 * # `<main>` lives here and nowhere else
 *
 * One per page. It is what a skip link targets and what a reader jumps to, and
 * a screen rendering its own inside this one gives the page two — at which
 * point the jump means nothing. Asserted, because it is invisible.
 *
 * # The current route is a PROP, all the way down
 *
 * `SidebarNav` can take renderLink from a framework binding to retain client
 * navigation, and exact items for section landing pages. It takes `current`
 * rather than reading the router, for the reason
 * `NavLink` gives one level down: a router is the one thing that cannot be
 * shared with the Next and Svelte siblings. The small Solid binding that
 * reads the pathname lives in the route, which is framework-specific anyway.
 *
 * Matching is by SEGMENT, not by prefix — `/app` does not light up for
 * `/apples` — and `/` is exempt, or it would be current everywhere.
 *
 * # An auth screen's heading is its title, not the wordmark
 *
 * `AuthShell` takes `title` as a required prop and renders it as the `h1`. A
 * sign-in page whose only heading is a logo gives a reader arriving by keyboard
 * or by screen reader nothing to orient on, and it is the commonest defect in
 * this screen because it looks fine.
 *
 * # The header's height is derived, not typed
 *
 * `--header-h` is computed from the control size and the padding it actually
 * uses, so it follows the density override. A hard-coded height would be the
 * exact defect the density toggle exists to expose, shipped in the component
 * that frames every page.
 */
export {};
