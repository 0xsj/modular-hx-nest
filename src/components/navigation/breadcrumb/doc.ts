/**
 * Breadcrumb — where this is, with the current page marked as current.
 *
 * # It takes data, not children, and that is the whole design
 *
 * Every rule a breadcrumb has is about the LAST item:
 *
 *     it is the current page
 *     it carries aria-current="page"
 *     it is NOT a link
 *
 * A composed API — `<Breadcrumb><Item/><Item/><Item/></Breadcrumb>` — leaves
 * all three to the caller, on every call site, and the failure is silent:
 * a breadcrumb whose last step is a link to the page you are already on looks
 * completely normal. It is the single most common breadcrumb defect and it
 * survives review because there is nothing to see.
 *
 * Taking `items` makes the position knowable, so the component applies the
 * three rules itself and a caller cannot omit them. The cost is composability
 * this component does not need: a crumb is a label and a destination, and
 * there is nothing to compose.
 *
 * # A link to where you already are
 *
 * Worth stating separately because it sounds pedantic and is not. It is an
 * affordance that does nothing — a reader is told "link", a keyboard user tabs
 * to it, and pressing it reloads the page. Rendering the last step as a `span`
 * removes it from the tab order, which is the point: the trail has as many tab
 * stops as it has places you can actually go.
 *
 * # `aria-current="page"` is what makes it a breadcrumb
 *
 * Without it the markup is a list of links inside a `nav`, which is a menu.
 * The attribute is the only thing distinguishing "you are here" from "here is
 * somewhere you could go", and it is what lets a reader jump to the end of the
 * trail to answer *where am I*.
 *
 * # The `nav` is named
 *
 * A page has several navigation landmarks — the main nav, a sidebar, this. A
 * landmark list reading "navigation, navigation, navigation" identifies none
 * of them, so the label is not decoration; it is what makes the landmark worth
 * having.
 *
 * # An ordered list, and the separators are not spoken
 *
 * `ol` because the sequence IS the meaning: the position in the list is the
 * depth in the hierarchy, and a reader is told "list of 4 items" before
 * hearing them.
 *
 * The separators are drawn in the markup and hidden from the tree. A reader
 * announcing "slash" between every step turns four words into eight, and the
 * hierarchy the slashes represent is already carried by the list.
 *
 * They are elements rather than CSS `::before` content on purpose: generated
 * content IS announced by some readers, so putting the separator in the
 * stylesheet moves it out of sight and leaves it in earshot.
 *
 * # The links are plain anchors, not the router's `A`
 *
 * Measured, and both reasons are about `A` doing something this component has
 * to control:
 *
 * **It injects global class names.** `activeClass` and `inactiveClass` default
 * to the unscoped strings "active" and "inactive", so every crumb would carry
 * one in a codebase that otherwise has no global classes.
 *
 * **It sets `aria-current="page"` itself**, on any href equal to the current
 * URL — and the router's own props are merged AFTER the caller's, so it cannot
 * be overridden. In a component whose entire contract is *exactly one step is
 * the current page*, a second claim appearing because a caller happened to
 * pass a matching href is the contract failing silently.
 *
 * Nothing is lost. The router intercepts ordinary anchor clicks by default —
 * `explicitLinks` is false — so these navigate client-side like any other
 * link. The exception is a project that turns `explicitLinks` on, where only
 * elements carrying the `link` attribute are intercepted; there these become
 * full page loads, which is a correctness-preserving degradation rather than a
 * break.
 *
 * # An intermediate step may have no href
 *
 * A category that groups pages without being one — "Settings > Billing >
 * Invoice" where Billing has no page of its own. It renders as plain text
 * rather than as a link that goes nowhere, which is the same rule as the last
 * item for the same reason.
 *
 * # What it does not do
 *
 * **No truncation or overflow menu.** Collapsing a long trail into "… >" needs
 * a disclosure with its own keyboard contract and a decision about which steps
 * survive. The current step is ellipsised in CSS — it is where you already
 * are, and the least useful to read in full — and a deeper trail than that is
 * a sign the hierarchy is too deep rather than a component to build.
 *
 * **It does not derive itself from the route.** Turning a pathname into labels
 * needs a map from segments to human names, which is the product's, not a
 * primitive's. A component that guessed would render "eu-west" as a title.
 */
export {};
