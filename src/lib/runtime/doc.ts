/**
 * runtime — state the shell owns, which no server has an opinion about.
 *
 *     runtime  may import  kernel · solid-js
 *     runtime  ✗ http · services · root
 *
 * This is the one tier below the components that is allowed to touch the
 * framework, because what it holds is browser state and there is no
 * framework-free way to subscribe to it.
 *
 * # The boundary is a question with a short answer
 *
 * **Could a server answer this?** Whether a sidebar is hidden is not a fact
 * about an organisation. No endpoint returns it, no other person would agree
 * with it, and it survives a reload only because this browser remembered.
 *
 * That is also why a query cache is the wrong tool for it: a cache caches
 * answers, and there is no question here.
 *
 * # An external store is READ as one, not mirrored into state
 *
 * The shape everybody writes first holds a signal and sets it from an effect on
 * mount. It works, and it renders once with a value it knows is provisional
 * before rendering again with the right one — and every consumer pays for the
 * first.
 *
 * The three questions any external store has to answer are the same in every
 * framework, and worth stating in those terms rather than in one framework's:
 *
 *     subscribe    how do I hear that it changed
 *     read         what is it now, in this browser
 *     server read  what does the server render, having no browser
 *
 * The third is the one that gets forgotten and the one that decides whether the
 * first paint is wrong.
 *
 * # A module-level mutable value is a cross-request leak on the server
 *
 * A `let` at module scope is shared across requests in a server process, so one
 * caller's value is served to the next. It works perfectly in development,
 * where one person loads pages one at a time, which is what makes it worth a
 * paragraph rather than a comment.
 *
 * A store here is safe only while the server never reads its mutable half. That
 * is a property of a specific file rather than of the pattern, and it is the
 * first thing to check about anything added.
 *
 * # Where the theme and the density would live
 *
 * `styles/tokens/shape.css` already reads `[data-density="compact"]`, and
 * `styles/semantic.css` already reads `[data-theme]`. Both attributes are the
 * store — they have to be, because CSS has to read them — so the job here is to
 * subscribe to the document rather than to keep a second copy in step.
 *
 * A control that ADOPTS the document's value on mount and writes only on intent
 * is correct. One that ASSERTS its own default on every mount erases whatever
 * was already there, after first paint, so the page visibly flips. The second
 * is one line shorter and almost always wrong.
 *
 * # Empty
 *
 * No store, no control, no attribute is set by anything. A tier arrives with
 * its first caller, and the shell that would be that caller does not exist.
 */
export {};
