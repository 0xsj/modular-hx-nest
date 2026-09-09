/**
 * Portal — render elsewhere in the DOM, without leaving the component tree.
 *
 * # It is a re-export, and that is the point
 *
 * It adds nothing today. It exists because of the rule in `components/doc.ts`:
 * whatever wraps a third-party thing is the only thing that imports it, and
 * every part gets wrapped — including the pass-throughs that add nothing —
 * because a rule with no exceptions is the only kind that survives.
 *
 * The cost is one file. The thing it buys is that the day a portal needs a
 * default mount point, a nonce for a content-security policy, or a
 * server-render guard, there is one place to put it rather than every import
 * site to find.
 *
 * # What it is for
 *
 * The DOM position and the component position are different questions. A
 * dropdown belongs to the button that owns its state, and it must not be
 * inside the `overflow: hidden` panel that button sits in — a clipped element
 * cannot be un-clipped by stacking, so this is not a z-index problem and no
 * amount of `z-index` fixes it.
 *
 * A portal keeps the ownership and moves the box. Context still flows,
 * reactivity still flows, and cleanup still happens with the owner — which is
 * the difference between this and appending a node by hand.
 *
 * # It renders NOTHING during a server render
 *
 * Measured: a page whose markup contains four portalled overlays and a
 * portalled demo box ships none of them in its server-rendered HTML — only the
 * triggers. A portal needs a document to mount into, and on the server there
 * is not one.
 *
 * Usually irrelevant, because the things that get portalled are closed on
 * load. It stops being irrelevant the moment something ESSENTIAL lives only
 * inside one: content that must be present for a crawler, for a
 * no-JavaScript reader, or in the first paint, is content that must not be
 * behind a portal.
 *
 * It is also why an audit of server-rendered output cannot say anything about
 * an overlay's internals — they are not there to audit.
 *
 * # What it does not solve
 *
 * **Focus order.** A portalled element is at the end of the document, so Tab
 * reaches it after everything else regardless of where its trigger is. That is
 * what focus management in the overlay primitives is for, and it is why they
 * trap and restore rather than relying on position.
 *
 * **Event bubbling is NOT broken by it, which surprises people the other way.**
 * The framework's events follow the component tree, so a click inside a portal
 * still reaches an ancestor handler — the one place a portal behaves
 * differently from what the DOM suggests.
 *
 * **Stacking.** Moving to the end of `body` changes the stacking context, so a
 * portalled element still needs a z token; `styles/tokens/z.css` holds the
 * ladder and the reasoning for its order.
 */
export {};
