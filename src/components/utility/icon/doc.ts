/**
 * The icon set — imported here and nowhere else.
 *
 * # Why one file rather than "only inside components/"
 *
 * `CLAUDE.md` says a library's wrapper is the only thing that imports it. For
 * icons the looser reading — anywhere under `components/` — costs more than it
 * saves: replacing the set then means finding every component that imports it.
 * Confined to this file it means editing one list, and every caller keeps
 * compiling against a name it already uses.
 *
 * # What routing them through one file makes visible
 *
 * The set of names actually in use becomes countable, and a countable surface
 * can be audited. Two questions it is here to answer later:
 *
 *   - is the same glyph imported under two names, because the library ships a
 *     deprecated alias beside its current one;
 *   - is a name being renamed at a call site because it collides with a noun
 *     this product owns. That collision is real and it should be settled here,
 *     once, rather than privately in whichever file hit it first.
 *
 * Neither has happened yet, because the list is two entries long. Both are
 * recorded because they are what the file exists to catch, and a file whose
 * purpose is only visible in hindsight gets deleted as ceremony.
 *
 * # Named re-exports, not `export *`
 *
 * Both tree-shake. Only the named form **states** the surface, which is the
 * point. Adding an icon is one line here, and that line is the constraint doing
 * its job rather than a formality: it is the moment somebody asks whether the
 * set already has one that means this.
 *
 * # The list is exactly what is used
 *
 * Four, and each arrived with the component that needed it. Not a curated
 * selection of what might be wanted — that is a list nobody maintains and
 * everybody stops trusting. If a component needs an icon that is not here, the
 * import fails, which is the correct amount of friction.
 *
 * `Minus` is worth its line: it is the INDETERMINATE glyph on a checkbox, and a
 * cross would have done visually. A cross reads as *no*; the third state is
 * *partly*, which is a different claim. Choosing between them is exactly the
 * question a one-line list is meant to provoke.
 *
 * # Subpaths rather than the barrel
 *
 * Measured on 2026-09-08 rather than assumed — the same page, the same two
 * icons rendered, only this file's import form changed:
 *
 *     subpath     4 lucide requests    939 total requests    1,954 ms
 *     barrel  2,081 lucide requests  3,016 total requests    8,124 ms
 *
 * In a PRODUCTION build the two are equivalent — the package declares
 * `sideEffects: false`, so an icon nobody imports is dropped either way. The
 * whole cost is paid by the dev server, on every page load, and it is four
 * times the load time for an identical render.
 *
 * This is the open question `components/forms/button/doc.ts` §6 recorded and
 * declined to guess at. It is now answered, and the figures are in
 * `notes/substrate/a-barrel-import-is-free-in-the-build-and-not-in-the-dev-server.md`.
 *
 * # An icon is decorative unless something says otherwise
 *
 * Every icon here renders an `<svg>` with no accessible name. That is correct
 * for the common case — a glyph beside text that already names the thing — and
 * wrong for an icon that IS the label. `Button`'s `size="icon"` branch already
 * forces an `aria-label` through its own types, which covers the case that
 * exists today.
 *
 * The general fix is an `AccessibleIcon` wrapper: hide the graphic, put real
 * text beside it. It is not here because nothing needs it yet, and a component
 * with no caller is a guess about what a caller will want.
 */
export {};
