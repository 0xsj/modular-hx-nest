/**
 * runtime — state the shell owns and no server has an opinion about.
 *
 * # Stores are framework-free; bindings stay explicit
 *
 * Every store here is a plain subscribe/get/set object, so the state machines
 * and the persistence copy verbatim into the sibling templates. `hooks.ts` and `observe.ts`
 * binds stores; `url-state.ts` binds portable query codecs to Solid Router and browser history.
 * Each sibling writes those bindings against its own framework.
 *
 * That is why this tier is NOT in the copy-verbatim set even though most of it
 * is: some files are bindings, and a check that says a directory is
 * portable when one file is not would be worse than no check.
 *
 * # `getSnapshot` must be stable, or it is a render loop
 *
 * A store returning a fresh object per call is a fresh identity per call, which
 * a subscription reads as a change on every render. The `set` here refuses a
 * write that is `Object.is`-equal, so a no-op assignment notifies nobody.
 *
 * # Preferences are read AFTER mount, never during render
 *
 * The server has no storage. A value read during render is therefore a
 * hydration mismatch, which presents as a flash of the wrong theme that
 * corrects itself — annoying, and the sort of thing people fix by disabling
 * SSR for the whole subtree. `server()` returns the default; `hydrate*` reads
 * the stored choice once, in an effect.
 *
 * # Theme has three states and density has two, and both are deliberate
 *
 * *Follow the system* is a CHOICE, not the absence of one: a user who picked it
 * wants the page to change when their OS does, and a user who picked `light`
 * wants it not to. It is expressed by REMOVING the attribute so the token
 * layer's media query takes over — which is why the semantic tokens are stated
 * twice, once under `prefers-color-scheme` and once under an explicit attribute.
 *
 * Density is a token override and nothing else. A component reading
 * `--control-md` gets the compact one for free; one that hard-codes a height is
 * now visibly wrong. Per browser, never per account — a screen offering it
 * should say so rather than imply a column that does not exist.
 *
 * # The interaction id is the piece the rest of the system was waiting for
 *
 * An interaction is a USER ACTION — not a request, not a component lifetime. A
 * click that fans out into four requests is one interaction, and all four
 * failures should name it. Scoped to a request the id degenerates into a second
 * request id; scoped to a mount it says only which screen was open, which is
 * what the reference screens had to do while this tier did not exist.
 *
 * It is deliberately NOT minted at module load: on the server that would be one
 * id shared by every request, which is one user's interaction attributed to the
 * next.
 *
 * Beginning one is an event handler's job, never a hook's, because a render is
 * not a user action.
 *
 * # Documents are observed, not turned into preferences
 *
 * `useStoredDocument` exposes loading followed by the storage Result, including
 * missing and failed reads. The framework-free document store caches snapshots
 * and connects after mount. Consumers keep their unsaved drafts separately;
 * an external storage notification must not erase an edit. Unlike theme/density,
 * an explicitly saved layout needs visible write failure and reset behavior.
 *
 * # URL writes read at event time
 *
 * A render snapshot can be older than the latest browser address. Merging a
 * second control change against that snapshot can erase the first. The binding
 * reads location when the action runs, preserves the fragment, and reports a
 * refused history write as a region-level Result. Push records user decisions;
 * replace repairs the current address without adding a second history entry.
 * Server-fetched query state should reuse the schema with router navigation.
 *
 * # A draft and a save attempt have different lifetimes
 *
 * save-draft.ts is the framework-free save/reconciliation model used by the
 * note, item and session recipes. A receipt settles its captured draft, while the editor
 * may already contain newer input. Optional synchronous checkpointing must
 * succeed before sending a write; after a reload, a captured unresolved attempt
 * returns as unknown and is checked rather than automatically sent again.
 * Domain refusal rules, revision matching and persistence stay caller-owned.
 *
 * # Authority and observation are separate state machines
 *
 * Session recovery verifies the original account without replaying a command.
 * Capability refresh withdraws grants until a new snapshot is accepted; unlike
 * ordinary data reads, an old authorization decision is not a loading fallback.
 * Job observation survives refresh failures, but stop-watching and cancellation
 * are separate operations. Backend acknowledgment does not invent completion.
 * All three stores are framework-free; their contracts sit beside the runtime
 * or corresponding services. Cookbook roots provide isolated authority fixtures.
 */
export {};
