/**
 * Button — the actionable primitive, and the one that decides how every other
 * primitive here is shaped.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ § CONTRACT — the oracle.                                                  │
 * │                                                                           │
 * │ Everything from here to § MECHANICS is behaviour a caller may depend on    │
 * │ and a black-box test may assert. It names no library, describes no         │
 * │ internal structure and contains no code, so it can be handed to a test     │
 * │ writer whole — the sanitising pass in protocols/spec-tests.md is a         │
 * │ section cut, not a grep.                                                   │
 * │                                                                           │
 * │ Written before the implementation existed. That is the property that       │
 * │ makes it an oracle rather than a description, and it cannot be recovered   │
 * │ later.                                                                    │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * # What it is
 *
 * A control that performs an action when activated. It is not a link: a link
 * navigates and belongs in history; a button changes something. When the thing
 * being rendered navigates, the caller supplies the anchor and Button lends it
 * an appearance — see `asChild` — rather than a button being made to navigate.
 *
 * It carries no state of its own, owns no layout, and decides nothing about
 * where it sits.
 *
 * # Shape
 *
 *     intent    "primary" | "secondary" | "ghost" | "danger" | "link"
 *               default "secondary"
 *     size      "sm" | "md" | "lg" | "icon"
 *               default "md"
 *     asChild   boolean, default false
 *     loading   boolean, default false
 *     disabled  boolean, default false
 *     type      "button" | "submit" | "reset", default "button"
 *
 * Plus every attribute a native button accepts, `color` excepted — the visual
 * register is `intent`, and two ways to spell it is one too many.
 *
 * `size: "icon"` additionally REQUIRES `aria-label`. This is a constraint on
 * the type, not a runtime check: the two branches are a union, and the icon
 * branch does not typecheck without a label.
 *
 * # Behaviour
 *
 * ## The default element and its type
 *
 * Renders a native button element unless `asChild` is set.
 *
 * `type` defaults to "button". A button owned by a form defaults to "submit"
 * in the platform, so without this a handler runs AND the form submits — a
 * defect invisible until the component is first used inside a form, which then
 * presents as a routing bug rather than a missing attribute.
 *
 * ## Inert: disabled and loading
 *
 * `disabled` and `loading` both make the control inert. They are the same
 * state for interaction purposes and different states for announcement.
 *
 * When inert, on the native element:
 *   · the native disabled attribute is set — unfocusable, unclickable,
 *     announced by the platform
 *   · `data-disabled` is present, so one CSS selector covers both branches
 *
 * When loading, additionally:
 *   · `aria-busy` is set
 *   · `data-loading` is present
 *   · a busy indicator renders, hidden from assistive technology, and the
 *     children still render alongside it — the label does not disappear
 *
 * When not inert, none of these attributes are present at all. Absent, never
 * false: `data-disabled="false"` still matches `[data-disabled]`.
 *
 * ## Handlers are passed through and never manufactured
 *
 * Button attaches no function the caller did not give it. If no handler is
 * passed, none is present on the rendered element — including while inert.
 *
 * This is a hard rule rather than a preference, and it is what the inert
 * behaviour above is shaped around. A component that always attaches a
 * handler — even one that does nothing on the happy path — cannot be rendered
 * from a server component at all, and takes every page that renders it down
 * with it. So inertness is expressed through attributes and styling, never
 * through a wrapped or synthesised handler.
 *
 * A caller's handler is called on activation when the control is not inert,
 * and is not called when it is.
 *
 * ## asChild
 *
 * With `asChild`, the caller supplies the element and Button lends it the
 * button's appearance. Exactly ONE element renders: the caller's, wearing the
 * button's classes. No wrapper is introduced and no tag is substituted.
 *
 * Where both sides supply the same thing, the resolution is fixed:
 *   · the caller's props win over the button's
 *   · `className` and `style` merge rather than replace
 *   · event handlers compose, the caller's running first — a caller's handler
 *     is never silently dropped
 *
 * With `asChild` and inert, the native disabled attribute is NOT set, because
 * it means nothing on an arbitrary element. Instead:
 *   · `aria-disabled` is set, for the announcement
 *   · the element is removed from the tab order
 *   · pointer interaction is suppressed through `data-disabled`
 *
 * When `loading` renders its indicator alongside a caller-supplied element,
 * the indicator renders INSIDE that element rather than beside it.
 *
 * ## Class names
 *
 * A caller's `className` is added to the button's own; it never replaces them.
 *
 * # Deliberately absent
 *
 * `fullWidth`. That is the caller's layout, expressed where the layout is, and
 * a prop for it puts one arrangement's needs inside every button.
 *
 * An icon slot. A caller placing an icon among the children already works and
 * needs no API for it.
 *
 * A `loadingText` prop. The label does not change while busy; `aria-busy` is
 * the announcement, and swapping the label moves the control under a reader's
 * cursor.
 *
 * # Known gaps — what this contract does NOT promise
 *
 * The `asChild` inert mitigation stops a click and stops tabbing to it. It does
 * NOT stop keyboard activation if something focuses the element
 * programmatically, and closing that gap needs exactly the synthesised handler
 * forbidden above. So the rule is: **do not render a link you do not want
 * followed.** `asChild` with `disabled` is a smell rather than a feature, and
 * the gap is recorded here rather than hidden.
 *
 * Nothing here promises a visible focus indicator; that is the reset's job and
 * is asserted where the reset is.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ § MECHANICS — NOT the oracle.                                             │
 * │                                                                           │
 * │ Strip everything below this line before handing the document to a         │
 * │ spec-test writer. It describes how the contract above is satisfied, and    │
 * │ a test derived from it is a snapshot of the current implementation        │
 * │ rather than a claim about intended behaviour.                             │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * # Radix has no Button, and that is correct
 *
 * A button needs no behaviour a headless library could own: the platform
 * element is focusable, keyboard-operable and self-announcing already. So this
 * borrows exactly one thing from `radix-ui` — `Slot` — and that one thing is
 * what makes it composable.
 *
 * Per the stack rule, this file's component is the only importer of `radix-ui`
 * in this directory. A screen imports Button, never Slot.
 *
 * # asChild beats an `as` prop
 *
 * `as="a"` would have to re-declare the prop types of every element it can
 * become, and still could not express *"render whatever component the caller
 * already has"* — which is the case that actually arises, with a router's Link.
 * `asChild` inverts it: the caller brings the element and Slot merges onto it.
 *
 * Slot's merge asymmetry is what the contract's resolution rules describe;
 * they are Slot's semantics, written out so a caller need not know that.
 * `Slot.Slottable` marks which child receives the props when there are several,
 * which is what puts the busy indicator inside the caller's element.
 *
 * # cva, and why the variants are a separate file
 *
 * `button.variants.ts` holds the cva map and exports its `VariantProps`. It is
 * separate so the variant surface can be read without the markup, and so the
 * type of `intent` and `size` has exactly one definition — the CSS class map
 * and the prop type cannot drift because the second is derived from the first.
 *
 * # The styling tier
 *
 * `button.module.css` is `@layer primitive`. A composition or a screen can
 * therefore override any of it without a specificity fight, by construction —
 * which is the whole reason the layer order exists.
 *
 * # The default intent is secondary
 *
 * A page with two primary buttons has none. The default is the one that is
 * always safe to reach for, so the emphatic one has to be asked for by name.
 */
export {};
