/**
 * runtime — state the shell owns, which no server has an opinion about.
 *
 * The tier boundary is a question with a short answer: **could a server answer
 * this?** Whether the sidebar is compact is not a fact about an organisation.
 * No endpoint returns it, no other person would agree with it, and it survives
 * a reload only because this browser remembered.
 *
 * That is also why a query cache is the wrong tool for it — a cache caches
 * answers, and there is no question here.
 *
 * # One framework file, and the rest is a plain state machine
 *
 *     store · theme · density · interaction    plain. No framework import
 *     signals                                  the binding, and only this
 *
 * The split is deliberate rather than tidy. A store, its persistence and its
 * three-state machine are the parts worth getting right; a subscription binding
 * is a few lines and differs per framework. Keeping them apart means the
 * interesting half is identical everywhere and the cheap half is the only thing
 * that varies.
 *
 * # The server must see the INITIAL value, not the live one
 *
 * `Store.server()` exists for that and `signals.ts` uses it. A module-level
 * mutable value read during a server render is shared across requests — one
 * caller's preference served to the next — and it works perfectly in
 * development, where one person loads pages one at a time. That is what makes
 * it dangerous rather than obvious.
 *
 * # Preferences are read after mount, never during render
 *
 * The server has no storage. A value read during render is a hydration
 * mismatch, and it presents as a flash of the wrong theme that then corrects
 * itself — which reads as a CSS problem and is not one.
 *
 * # Three states for a theme, and the third is the one that gets dropped
 *
 *     system   NO attribute. prefers-color-scheme decides
 *     light    data-theme="light"
 *     dark     data-theme="dark"
 *
 * `system` is the ABSENCE of the attribute rather than a third value, because
 * the semantic layer's guard is `:root:not([data-theme="dark"])` — a third
 * value would satisfy it by accident and break the day somebody writes a
 * `[data-theme]` rule assuming the attribute names a palette. It is the same
 * mistake the product refuses one tier down: an unattempted check is not a
 * check that returned nothing.
 *
 * # Density changes tokens, not components
 *
 * `styles/tokens/shape.css` overrides three control heights under
 * `[data-density="compact"]`. Nothing else knows density exists. The
 * alternative — a `density` prop threaded through every control — is the
 * version that rots: one component forgets and the screen is half compact.
 *
 * # An interaction is a user action, not a request
 *
 * This is what makes a correlation id worth carrying. A click that fans out
 * into four requests is ONE interaction, and all four failures should name it.
 * Scoped per request the id is just a second request id; scoped per mount it
 * says only which screen was open.
 *
 * It is deliberately not minted at module load — on a server that would be one
 * id shared by every request. The empty string means *none has begun*, and a
 * caller can see that.
 */
export {};
