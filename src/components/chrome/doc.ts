/**
 * chrome — the shell around a screen, and the only component group whose job is
 * to render state that no server has an opinion about.
 *
 * These are the callers `lib/runtime` was built for. Everything else in the
 * design system takes its data from props; these three read a store that
 * belongs to the browser, which is why they are a separate group rather than
 * three more display components.
 *
 * # A settings control is a single-select, and it should say so
 *
 * The stand-in these replaced was a row of buttons carrying `aria-pressed`.
 * Three of those announce three independent on/off states; the truth is one
 * choice with three answers, exactly one of which is true. A reader is told how
 * many decisions are in front of them, and the two versions give different
 * answers to that.
 *
 *     radiogroup      one Tab stop · arrows move · exactly one checked
 *     three buttons   three Tab stops · three separate pressed states
 *
 * Both toggles share one unexported `Segmented` at group level, so the two
 * cannot drift into two segmented controls. The counter-argument — that a
 * segmented control is often built with toolbar semantics — is recorded there
 * rather than settled silently.
 *
 * # The flash is the bug, and it is not fixable in a component
 *
 * A preference read after mount costs a frame: the light first paint, then the
 * jump. By the time `ThemeToggle` mounts the page has already been painted, so
 * nothing this group does can prevent it. `lib/runtime/boot.ts` is a blocking
 * inline script in the root layout — the only code in the app that runs ahead
 * of the bundle — and it exists because of this group.
 *
 * It restates what `theme.ts` and `density.ts` know, and cannot not: the point
 * is to run without them. `boot.test.ts` runs both paths against the same
 * storage and requires the same DOM out, which makes the drift loud instead of
 * silent.
 *
 * Its second cost is that the document no longer matches what the server sent,
 * which some frameworks compare during hydration. The attributes are
 * correct and the comparison is what is wrong, so the root layout opts that one
 * element out — one element, never a subtree, because a suppression that
 * reaches children hides real mismatches.
 *
 * # Each control hydrates itself
 *
 * Rather than depending on a shell that called a setup hook. Every hydrate is
 * idempotent, so the cost of a second one is a storage read, and the benefit is
 * that a control works wherever it is dropped — including in a gallery, which
 * is the only place most of them get reviewed.
 *
 * # The wordmark's ELEMENT is the caller's fact
 *
 * On a landing page it is the page's heading; in a header it is a lockup. A
 * `Mark` that hard-codes `h1` gives a document two of them or none, and nothing
 * in a visual review shows which. So `as` is a prop — and it is the one place
 * this system uses `as` rather than `asChild`, because the content is what the
 * component is for.
 */
export {};
