/**
 * The style layer: what a colour is allowed to be, and who is allowed to win.
 *
 * Origin — the ladder below arrived measured rather than chosen, so it is a
 * FINDING and not an intention. The things this template has not built are
 * marked where they appear.
 *
 * # Cascade layers are the tier model, not tidiness
 *
 *     reset · token · base · primitive · composition · screen · override
 *
 * The order is the whole point. A screen's module always beats a primitive's
 * because it sits in a later layer, so a caller can override a primitive
 * WITHOUT raising specificity — no `!important`, no `.button.button`, no
 * ordering games in the bundler. Specificity inside a layer still applies;
 * across layers it does not, and that is what makes the rule followable rather
 * than merely stated.
 *
 * The alternative was one flat sheet with a naming convention. It was declined
 * because a convention is enforced by whoever reviews the diff, and this is
 * enforced by the engine.
 *
 * `layers.css` must be the FIRST style imported. A layer named after a rule has
 * already been parsed does not reorder it, so an import order that puts a
 * component's module ahead of the declaration silently loses the tier model —
 * and it fails as a specificity bug three files away.
 *
 * # Two colour tiers, and a component may only see one
 *
 * `primitives.css` is the palette and nothing else — raw values, no meaning.
 * `semantic.css` gives each value a job. A component reads `--ink-3`, never
 * `--neutral-500`, because a component that reaches into the palette has
 * pinned a colour to a theme and will be wrong in the other one.
 *
 * That is the swappable seam here: a product replaces `primitives.css` and
 * every component follows, because no component ever named a palette step.
 *
 * # Three theme states, and the third is the one that gets forgotten
 *
 *     explicit dark    :root[data-theme="dark"]   — a toggle
 *     explicit light   :root[data-theme="light"]  — a toggle
 *     system default   neither stamped; prefers-color-scheme decides
 *
 * This tree is dark-first, so bare `:root` carries the DARK palette and the
 * light one is redefined twice: once inside `@media (prefers-color-scheme:
 * light)` guarded by `:not([data-theme="dark"])`, and once under
 * `[data-theme="light"]`. The guard is what lets an explicit dark choice beat a
 * light OS. Every token is defined on bare `:root` before either block touches
 * it — a token that exists only inside a media query does not exist in the
 * default state, which renders one theme's text on the other's ground.
 *
 * The third state is the ABSENCE of the attribute, not a third value. Writing
 * `data-theme="system"` satisfies the guard by accident and breaks the day
 * somebody writes a `[data-theme]` rule assuming the attribute names a palette.
 *
 * Nothing sets the attribute yet. No toggle exists.
 *
 * # The text ladder was measured, not chosen
 *
 * `--ink` through `--ink-4` are monotonic in prominence in BOTH themes, and the
 * bottom two moved after being measured against a render rather than eyeballed.
 * `--ink-4` carries small text that is information rather than decoration —
 * timestamps, axis labels, counts — and an earlier pass had it at 2.81:1 in
 * light and 2.72:1 in dark. Both now clear 4.5:1 nominal.
 *
 *     --ink-4    before   light 2.81:1   dark 2.72:1
 *                after    light 5.10:1   dark 5.60:1
 *
 * Reading a screenshot missed it twice; sampling the pixels and computing the
 * ratio found it in one pass. See `protocols/render-verification.md`, which is
 * where that procedure is written down.
 *
 * **The honest limit:** those ratios were measured on the surfaces that build
 * used. A pair used here and absent from that audit is unaudited, and nothing
 * detects it. The ladder is a good starting floor, not a certificate.
 *
 * # The accent is also the healthy state, and that is a constraint
 *
 * Green says "clickable" and green says "fresh". Nothing may therefore be
 * distinguished by hue alone: a state carries a glyph or a word as well. That
 * is not a style preference — it is the only thing keeping a status legible
 * when the accent and the success colour are the same family.
 *
 * A product that changes the accent to something outside the success family
 * relaxes this. Until it does, the rule holds.
 *
 * # Deliberately absent
 *
 * A utility layer. The token tiers and the cascade order already decide what a
 * caller may override, and a utility layer competes with them for the same
 * decisions.
 *
 * A `--space-0`. Zero is zero; naming it invites `var(--space-0)` in places
 * that mean "no gap" and hides that from a reader.
 *
 * # Not yet wired
 *
 * Nothing imports this. `src/app.tsx` still imports the scaffold's `app.css`,
 * which hard-codes colours and sizes and contradicts every rule above. Deleting
 * that and importing `layers.css` + `tokens/index.css` + `reset.css` +
 * `base.css` is the next step and has not been taken.
 */
export {};
