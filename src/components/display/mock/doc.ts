/**
 * Mock — content that is not the product's data, marked as such.
 *
 * # Why a component and not a comment
 *
 * `CLAUDE.md` says a mock is a reference for layout, copy and interaction and
 * never for code. The rule has one failure mode and it is not
 * misunderstanding it: it is that placeholder content looks exactly like real
 * content, so it survives review, ships, and is then screenshotted into a deck
 * where nobody remembers it was invented.
 *
 * A comment in the source does not travel with the pixels. This does. The
 * requirement is not that the marking be tasteful — it is that removing it be
 * a deliberate act, and that forgetting be visible from across the room.
 *
 * # Conspicuous on purpose
 *
 * Dashed border, warning tint, a small caps label. Nothing else in the system
 * is dashed, so it reads as unfinished without having to be read, and the
 * pattern survives being resized to a thumbnail.
 *
 * This is the one place the design system is deliberately ugly. A tasteful
 * marker is one that can be mistaken for a design decision, and a mock that
 * looks intentional is a mock that ships.
 *
 * **It survives print.** A screenshot pasted into a document is where invented
 * numbers do their damage, and a disclaimer carried only by a background
 * colour is the first thing a printer drops. The border stays and the label is
 * forced to black.
 *
 * # The disclaimer is announced BEFORE the content
 *
 * A reader meets the children in order, so a note placed after them arrives
 * once the figures have already been heard and believed. The visually-hidden
 * text is therefore the first child, and the visible tag is `aria-hidden` so
 * the statement is made exactly once.
 *
 * # What it does not do
 *
 * **It does not fail the build.** Tempting, and wrong: the whole point is that
 * a screen can be built before its endpoint exists, so this has to be usable
 * in the branch that ships to a staging environment. What it does instead is
 * carry `data-mock`, which is a single selector — for a test that asserts a
 * production page has none, or for a grep before a release. Enforcement is
 * available and is not this component's to impose.
 *
 * **It is not the memory adapter.** Fixtures served through `lib/http`'s
 * memory client are a supported way to RUN the application, and they render as
 * ordinary content because they are standing in for a real response. This
 * marks something weaker: content invented for the layout's sake that no
 * adapter is even pretending to serve.
 *
 * **It does not hide itself in production.** A build flag that removes the
 * marking leaves the mock content in place and removes the only sign of it,
 * which is precisely the accident this exists to prevent.
 */
export {};
