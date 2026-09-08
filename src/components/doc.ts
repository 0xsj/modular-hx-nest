/**
 * The design system. Ten groups, no components.
 *
 * Origin — written before any component exists, so everything here records an
 * INTENTION rather than a finding. That is deliberate: a contract written
 * before the implementation cannot have been derived from it, which is the one
 * property `protocols/spec-tests.md` says cannot be recovered later. When the
 * first component lands, whatever this got wrong should be corrected here
 * rather than quietly worked around.
 *
 * # Anatomy
 *
 *     <group>/<name>/
 *       <name>.tsx           markup
 *       <name>.module.css    styling, in @layer primitive
 *       <name>.variants.ts   cva — the only variant mechanism
 *       doc.ts               why this looks like this
 *       index.ts             the barrel
 *
 * `.variants.ts` appears only where variants exist. In the build these groups
 * come from that was ten components of forty-two, so the file is earned rather
 * than expected.
 *
 * # The groups, and why a taxonomy up front
 *
 *     charts       frames and the pure kernel under them
 *     chrome       product furniture — the mark, the theme control
 *     display      panel, table, badge, stat, avatar, empty
 *     feedback     alert, skeleton
 *     forms        button, field, input, select, checkbox, switch, toggle
 *     layout       separator, and whatever else is pure arrangement
 *     navigation   nav-link, tabs, breadcrumb
 *     overlays     dialog, popover, tooltip, dropdown-menu
 *     typography   heading, text, section-label
 *     utility      icon, portal, visually-hidden, accessible-icon
 *
 * The directories exist and are empty, held by `.gitkeep` so a clone keeps
 * them. That is a claim about shape and not about content: a group with no
 * component in it is a name, and a name is cheap to move. A component whose
 * group is wrong is the thing worth noticing, and having the ten written down
 * is what makes that noticeable on the day it happens.
 *
 * # The seams this tier owns
 *
 * **Ark UI is imported here and nowhere above.** A screen imports the wrapper,
 * never the headless library. Every part gets wrapped, including the ones that
 * are pass-throughs and add nothing today — the rule is only enforceable if it
 * has no exceptions, and an exception that costs nothing is how a library stops
 * being replaceable one import at a time.
 *
 * **Icons come from one file of named re-exports** — `utility/icon` — so the
 * set in use stays countable, and a countable surface can be audited. A named
 * re-export states the surface; `export *` does not, and both tree-shake.
 * Adding an icon is one line, and that line is the constraint working: it is
 * the moment somebody asks whether the set already has one that means this.
 *
 * **The primitive owns styling and the token contract; the library owns
 * behaviour and accessibility wiring.** That split is what makes the
 * accessibility floor affordable — focus traps, dismiss layers, roving
 * tabindex and portal ordering are solved problems with long tails, and
 * reimplementing them is how a component library ships a keyboard trap.
 *
 * # Two rules that make a defect unrepresentable rather than unlikely
 *
 * Both are from `protocols/accessibility.md`, and both are here because the
 * failure they prevent produces no error.
 *
 * **Hand the wiring over; do not reach in.** A field wrapper passes a bag of
 * props and the caller places them. The alternative — cloning the child to
 * attach an id and a described-by — fails the moment the child is not the
 * control, and fails silently: the label points at an id nothing has.
 *
 * Solid makes this the easy shape rather than the awkward one. A function
 * child is idiomatic here, where in a cloning ecosystem it reads as a
 * concession.
 *
 * **A primitive may not manufacture a handler.** Handlers are passed through,
 * never created. A component that attaches a function it was not given has
 * taken on a capability requirement its callers never agreed to, and the
 * failure surfaces somewhere else entirely. Express the state declaratively —
 * the real `disabled` attribute, `tabindex`, a data attribute the stylesheet
 * reads — and let the platform enforce it.
 *
 * # What is NOT decided
 *
 * **How Ark's `asChild` is used.** It is a render prop — `asChild={(props) =>
 * <A {...props()} />}` — so the caller places the props, which is the same
 * shape as the field rule above. Whether every polymorphic primitive here
 * exposes it, and under what name, is open until the first one needs it.
 *
 * **Whether `utility/icon` re-exports from the barrel or from subpaths.** Both
 * tree-shake in a production build; the subpath form avoids handing the
 * bundler 1,819 modules in development. Not measured here.
 *
 * **Which components exist at all.** None do. A group directory is not a
 * promise that it will be filled.
 */
export {};
