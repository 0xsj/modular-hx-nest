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
 * `.variants.ts` appears only where variants exist — a component with one
 * appearance does not get a variant map to hold nothing. The file is earned
 * rather than expected.
 *
 * # The groups, and why a taxonomy up front
 *
 *     charts       frames and the pure kernel under them
 *     chrome       mark, theme-toggle, density-toggle, segmented
 *     display      panel, table, badge, stat, avatar, empty, mock, presence
 *     feedback     alert, skeleton
 *     forms        button, field, input, select, checkbox, switch, toggle
 *     layout       box, flex, container, separator
 *     navigation   nav-link, tabs, breadcrumb
 *     overlays     dialog, alert-dialog, popover, tooltip, menu
 *     typography   heading, text, section-label
 *     utility      icon, visually-hidden, accessible-icon, portal
 *
 * # What the list above got wrong, now that three groups exist
 *
 * This file was written before any component, and said so. Recording the
 * corrections here rather than quietly editing them in is the point of having
 * written it early.
 *
 * **`display` was two short.** `presence` and `mock` were not predicted, and
 * neither is a display concern in the obvious sense — both exist to stop a
 * distinction being lost at the moment it is rendered. `presence` is the
 * render half of `lib/kernel`'s three states; `mock` marks content that is not
 * the product's data. The group turned out to be about what a screen CLAIMS,
 * not about what it draws.
 *
 * **`layout` resolved to more than arrangement primitives.** "Whatever else is
 * pure arrangement" became `box`, `flex` and `container` — and a fourth thing
 * the anatomy below does not describe: a module shared by the whole group.
 *
 * **`feedback` was predicted exactly** — `alert` and `skeleton`, and nothing
 * else turned up. Worth recording as the case where the guess held: the two
 * that were named are the two a screen needs to say *something is happening*
 * and *something happened*, and neither grew a third sibling once written.
 *
 * **`overlays` was one short, and the missing one is the interesting one.**
 * `alert-dialog` was not predicted, and it turns out to be a single prop —
 * `role="alertdialog"` — from which the library derives three behaviours. It
 * exists as a named component anyway, because a caller who has to remember a
 * prop will forget it and the failure is a destructive confirmation that
 * closes on a stray click. That is a general shape worth watching for: when
 * one flag changes a cluster of behaviour, the flag wants a name.
 *
 * **`typography` and `utility` were both predicted exactly**, and `utility`
 * arrived in pieces rather than at once — `visually-hidden` when a stat needed
 * to announce an em dash, `accessible-icon` and `portal` last. A group whose
 * members are each earned by a caller is the shape the rest should have had.
 *
 * **`chrome` grew a primitive that is not chrome.** `segmented` is a generic
 * control — radio semantics in a segmented shape — and it lives here because
 * both of its callers do. It stays until a third caller outside the group
 * wants it, at which point it moves rather than being copied. The rule that
 * decides it is the same one everywhere: a shared thing is earned by a second
 * caller, and MOVED by a caller in a different group.
 *
 * **The anatomy assumed every file belongs to one component.** `style-props.ts`
 * sits at `components/` root and is imported by three of them, because the
 * spacing props are a contract BETWEEN components rather than the property of
 * any one. A per-component copy would let the scale drift silently, which is
 * the failure the tokens exist to prevent. Shared modules at the group or root
 * level are therefore allowed, and are earned the same way a `.variants.ts`
 * is: by a second caller, never by anticipation.
 *
 * The directories that remain exist and are empty, held by `.gitkeep` so a
 * clone keeps them. That is a claim about shape and not about content: a group with no
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
