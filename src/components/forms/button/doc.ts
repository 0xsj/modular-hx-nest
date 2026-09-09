/**
 * Button — the actionable primitive, and the shape every other primitive here
 * copies.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A NOTE, NOT AN ORACLE — `flover-solid ADR 0001`.
 *
 * This file was written before `button.tsx` existed and hashed at that moment,
 * and that ordering was worth having: it is what produced B11, the icon-name
 * union, and the spinner consequence in §4.3, each of which is a design
 * decision that would have been made differently, or not at all, with the
 * implementation already on screen. The pressure was the benefit and it has
 * been collected.
 *
 * What it is NOT is a sealed oracle. flover-solid ADR 0001 puts the barrier on
 * `src/lib/**`, starting with `lib/http`, and keeps it off components — the
 * mutation round that scores a spec test degenerates here into class-map
 * swaps, and killing those needs the class-name assertions
 * `protocols/accessibility.md` tells you not to write. Nothing in this file is
 * passed to a barriered writer.
 *
 * §3 is still normative, and it is still the thing to test — with an ordinary
 * interaction test, written with the implementation in view, asserting
 * accessible output rather than class names. **No such test exists yet.** The
 * sixteen clauses were checked once by a throwaway browser probe that was not
 * committed, so today they can regress silently. That record names it as the
 * cost of the decision rather than pretending it away.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *
 * # 1 · What a button is
 *
 * A control that performs an ACTION IN PLACE. Pressing it runs something; it
 * does not navigate, and it holds no value.
 *
 * The three it is confused with, and the test that separates each:
 *
 *     Button    does something.        Does the URL change? No  -> button
 *     Link      goes somewhere.        Does the URL change? Yes -> anchor
 *     Toggle    stays pressed.         Does it have an on state? -> aria-pressed
 *     Switch    a setting, applied     Does it take effect before Save?
 *               immediately.
 *
 * Getting the first two backwards is the common one and it is not cosmetic: an
 * anchor announces itself as a link and offers open-in-new-tab, middle-click
 * and a status-bar preview, none of which a button has and all of which a
 * person will try. A button that navigates is a link that has thrown its
 * affordances away.
 *
 * **No headless library owns this.** Ark UI has no Button and neither does
 * Radix, because the platform `<button>` is already focusable, keyboard
 * operable, and self-announcing. There is no behaviour to buy. What this
 * component borrows from Ark is exactly one thing — the polymorphism in
 * §4 — and it borrows nothing else.
 *
 *
 * # 2 · Shape
 *
 * ## 2.1 Variants — the appearance axes, and both have a default
 *
 *     intent   primary | secondary | ghost | danger        default: secondary
 *     size     sm | md | lg | icon                         default: md
 *
 * `intent` defaults to `secondary` because a page with two primary buttons has
 * none. The default is the one that is always safe to reach for, and the
 * emphatic one has to be asked for by name.
 *
 * ## 2.2 Props
 *
 *     intent?     ButtonIntent
 *     size?       ButtonSize
 *     loading?    boolean        default false
 *     disabled?   boolean        default false
 *     type?       "button" | "submit" | "reset"   default "button"
 *     class?      string         composed with the variant classes, never replacing them
 *     asChild?    ButtonAsChild — aliased from Ark, see the amendment below
 *     children?   JSX.Element
 *     ...every other native button attribute
 *
 * ### AMENDED 2026-09-08, after implementation
 *
 * §2.2 first wrote this prop's signature by hand as
 * `(props: () => Record<string, unknown>) => JSX.Element`. That is wrong, and
 * the compiler found it: Ark passes `(userProps?) => JSX.HTMLAttributes<any>`,
 * and a parameter type is contravariant, so the hand-written form is not
 * assignable to Ark's. The type is now aliased from Ark
 * (`NonNullable<PolymorphicProps<"button">["asChild"]>`) rather than restated,
 * so it cannot drift when Ark changes it.
 *
 * The amendment is marked rather than folded in silently, because an oracle
 * that is edited to agree with the code it is measuring has stopped being an
 * oracle. This one changed a SIGNATURE and no clause in §3 — the contract is
 * untouched, which is the thing to check when a spec is amended after the
 * fact. `protocols/spec-tests.md` §5: fix the spec, then the test, never the
 * test alone.
 *
 * ## 2.3 The type is a union, and the icon branch demands a name
 *
 *     ButtonProps =
 *       | Base & { size?: Exclude<ButtonSize, "icon"> }
 *       | Base & { size: "icon"; "aria-label": string }
 *
 * `size="icon"` renders no text, so a screen reader has nothing to announce —
 * the single most common accessible-name failure in a component library. A
 * union moves that from a review comment to a compile error. This is the one
 * rule in this file enforced by the type system rather than by a check.
 *
 *
 * # 3 · CONTRACT
 *
 * Numbered so a failure can cite one. Each is a claim about observable output,
 * not about how the component is written.
 *
 * ## Rendering
 *
 *   B1  With no `asChild`, it renders exactly one `<button>` element.
 *
 *   B2  `type` defaults to `"button"`.
 *       A `<button>` inside a form defaults to `type="submit"`, so without
 *       this `<form><Button onClick={apply}>Apply</Button></form>` runs the
 *       handler AND submits. Invisible until the component is first used
 *       inside a form, and it then presents as a routing bug.
 *
 *   B3  Every `intent` × `size` combination produces a non-empty class string,
 *       and that string contains neither `"undefined"` nor `"null"`.
 *       Totality: 4 × 4 = 16 combinations, plus the two defaulted forms.
 *
 *   B4  A caller's `class` is COMPOSED with the variant classes, never
 *       replaces them. Both are present in the output.
 *
 *   B5  `children` are rendered.
 *
 * ## Inertness — `disabled` and `loading` are one state with two names
 *
 *   B6  `inert` is `disabled || loading`. Every rule below keys off `inert`,
 *       not off `disabled` alone.
 *
 *   B7  Without `asChild`, an inert button carries the real `disabled`
 *       attribute. Not `aria-disabled`, not `pointer-events: none` — the
 *       platform attribute, which is unfocusable, unclickable and announced.
 *       Dimming a control is not disabling it.
 *
 *   B8  An inert button carries `data-disabled`, so ONE stylesheet selector
 *       covers both the native and the polymorphic branch. Absent — not
 *       `data-disabled="false"` — when not inert.
 *
 *   B9  `loading` sets `aria-busy` and `data-loading`, and both are ABSENT
 *       rather than `"false"` when not loading.
 *
 *   B10 A loading button keeps its accessible name. The name may not be
 *       replaced by a spinner, a label change, or an emptied child.
 *
 * ## The rule this component exists to hold
 *
 *   B11 **A primitive may not manufacture a function prop it was not given.**
 *       If no `onClick` is passed, no `onClick` appears in the output. This
 *       holds for every `on*` prop and it holds especially in the inert state,
 *       where the tempting shape is a handler that swallows the event.
 *
 *       A component that always attaches a handler takes on a capability
 *       requirement its callers never agreed to. It is expressed
 *       declaratively instead — the attribute in B7, the tab order in B13, and
 *       `pointer-events` from the data attribute in B8.
 *
 *   B12 A caller's handler is never wrapped, replaced, or conditionally
 *       swapped. `onClick={inert ? swallow : props.onClick}` is a violation of
 *       B11 for the callers who reach the true branch, non-deterministically.
 *
 * ## Polymorphism
 *
 *   B13 With `asChild`, NO `<button>` element is rendered. The caller's element
 *       is the only one. No wrapper, no cloned tag.
 *
 *   B14 With `asChild` and inert: `aria-disabled` is set and `tabIndex` is
 *       `-1`. The native `disabled` attribute is NOT used, because it means
 *       nothing on an anchor.
 *
 *   B15 With `asChild`, `type` is NOT passed. It is meaningless on an anchor
 *       and invalid markup.
 *
 *   B16 **The `href` gap is not closed, and that is recorded rather than
 *       hidden.** B14 stops a pointer click and stops tabbing to it. It does
 *       NOT stop Enter if something focuses the anchor programmatically.
 *       Closing that would require exactly the manufactured handler B11
 *       forbids. So the rule is a rule about CALL SITES: do not render a link
 *       you do not want followed. `asChild` with `disabled` is a smell, not a
 *       feature.
 *
 *
 * # 4 · Mechanics
 *
 * ## 4.1 `asChild` is a render prop, and that is Ark's shape rather than a
 * choice made here
 *
 *     <Button asChild={(props) => <A href="/x" {...props()}>Go</A>}>
 *
 * The caller receives a function, calls it, and spreads the result onto their
 * own element. Nothing is cloned and nothing is inspected.
 *
 * This matters beyond ergonomics. The React ecosystem's version of this clones
 * the child to attach props, which fails silently the moment the child is not
 * the element — wrapped in a fragment, a layout div, an adapter — and the
 * props land on the wrapper. Handing them over cannot fail that way, because
 * the caller has to put them somewhere and the only place they type-check is
 * on the element. It is the same asymmetry `protocols/accessibility.md` argues
 * for in a form field, one tier down.
 *
 * A boolean `asChild` plus a cloned child is therefore not available here, and
 * an `as="a"` prop is not wanted: it would have to re-declare the prop types of
 * every element it can become and still could not express *render whatever
 * component the caller already has*, which is the case that actually arises.
 *
 * ## 4.2 The merge is not symmetric, and the asymmetry is load-bearing
 *
 * Read out of `@zag-js/solid`'s `mergeProps(parentProps, userProps)` and
 * confirmed by running it, on 2026-09-08:
 *
 *     ordinary props   the CALLER wins       last source defined wins
 *     class            CONCATENATED          parent's first, then the caller's
 *     style            merged
 *     on* handlers     COMPOSED              the caller's runs FIRST, then ours
 *     ref              STRIPPED              removed before the merge; a ref
 *                                            never reaches the caller's element
 *
 * Two consequences worth stating because a test can check them and a reader
 * cannot guess them:
 *
 *   - A caller's `onClick` is never silently discarded — it is composed, and
 *     it runs first. This is what keeps B12 true through the merge.
 *   - `ref` does not pass through. A caller who needs a handle to the element
 *     puts it on their own element directly. Anything here that tried to
 *     forward one would be forwarding into a void.
 *
 * ## 4.3 The spinner is a style, not a child — forced by 4.1
 *
 * `asChild` hands the caller the props and the caller renders the children, so
 * this component CANNOT inject a spinner element into the polymorphic branch.
 * The React version solves that with a slot marker; Ark has no equivalent.
 *
 * Two mechanisms for one state is how the two branches drift, so there is one:
 * `data-loading` (B9) and a stylesheet that draws the indicator. It is
 * identical in both branches by construction rather than by attention, and it
 * is why this component imports no icon.
 *
 * ## 4.4 cva owns the class map, and is the only variant mechanism
 *
 * `button.variants.ts` is the single place a variant name maps to a class. A
 * conditional class list in the markup is the alternative and it is refused:
 * it puts the map in the render path where a fifth intent has to be added by
 * reading JSX.
 *
 * `intent: "neutral"` style keys that map to the empty string are still
 * listed rather than omitted, because a variant key present in the type and
 * absent from the map is a runtime `undefined` in the class list — which B3
 * is written to catch.
 *
 * ## 4.5 Props are not destructured, because Solid props are reactive
 *
 * `const { intent } = props` reads once and never updates. Solid's props are a
 * proxy; destructuring at the top of a component silently converts every prop
 * into a constant, and nothing errors. `splitProps` is the mechanism.
 *
 * This is the Solid-specific trap in this file and it has no analogue in the
 * sibling templates, which is exactly why it is written down here rather than
 * assumed to be common knowledge.
 *
 *
 * # 5 · Deliberately absent
 *
 *     fullWidth      the caller's layout, expressed where the layout is. A
 *                    prop for it puts one arrangement's needs in every button
 *     an icon slot   <Button><Icon/>Label</Button> already works and needs no API
 *     a loading label  swapping the text on load breaks B10
 *     ButtonGroup    a composition with its own keyboard model, not this
 *     link intent    a button styled as a link is the confusion in §1, sold
 *                    as a variant
 *
 *
 * # 6 · What this specification does NOT decide
 *
 * Stated so a test writer reports these rather than guessing, and so a reader
 * does not mistake silence for a rule.
 *
 *   - The concrete class NAMES cva emits. They are CSS-module hashes; assert
 *     that a class is present and stable, never its text.
 *   - The visual appearance of any intent. That is the stylesheet's, and no
 *     assertion here should depend on a colour.
 *   - Whether `loading` should also imply `aria-live`. It does not today, and
 *     no case has needed it.
 *   - Focus-ring geometry. `styles/reset.css` owns `:focus-visible` globally.
 *   - What happens when BOTH `asChild` and `children` are passed. Ark ignores
 *     `children` in that branch; whether this component should refuse it
 *     loudly is open.
 */
export {};
