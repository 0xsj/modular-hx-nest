/**
 * NavLink — a link that knows whether it is the current route.
 *
 * # Two different questions, and the router answers both
 *
 * "Is this the page I am on?" and "is this the section I am in?" are not the
 * same question, and a nav that answers only one of them is wrong in a way
 * nobody reports.
 *
 *     /sites          the link
 *     /sites/eu-west  where the user is
 *
 * The `/sites` item should stay LIT — you are inside it — and it must not
 * claim to be the current page, because it is not: the current page is
 * `/sites/eu-west`. Announcing "Sites, current page" sends somebody looking
 * for a page they are not on.
 *
 * The router already draws this distinction, and this wrapper's job is to not
 * undo it:
 *
 *     activeClass          PREFIX match (or exact, with `end`)  -> the highlight
 *     aria-current="page"  EXACT match, always                  -> the claim
 *
 * `end` narrows the highlight and does not touch `aria-current`, which is
 * correct — the visual is a design decision about how much of the trail to
 * light, and the announcement is a fact.
 *
 * **So this component sets no `aria-current` of its own.** The naive version —
 * comparing the href to the pathname and writing the attribute — collapses the
 * two questions into whichever one it implemented, and is the bug this note
 * exists to prevent.
 *
 * # The stylesheet selects the attribute, not a class
 *
 * The current-page weight is keyed off `[aria-current="page"]` rather than off
 * a class the component adds alongside it. That is not a preference: a class
 * and an attribute set from the same condition can be changed independently,
 * and the day they disagree the screen shows one page as current while a
 * reader is told about another. Selecting the attribute makes the mark and the
 * announcement the same condition rather than two copies of it.
 *
 * # `activeClass` is passed explicitly, and must be
 *
 * The router's defaults are the strings `"active"` and `"inactive"` — GLOBAL
 * class names, in a codebase whose styling is otherwise entirely scoped
 * modules. Left alone, every link in the application carries one of two
 * unscoped names that any stylesheet, any dependency, and any future
 * `@layer` rule is free to match.
 *
 * They are therefore overridden with this module's hashed names, and the props
 * are removed from the public type so a caller cannot reintroduce the problem
 * by passing their own.
 *
 * # A link to "/" is active everywhere unless you pass `end`
 *
 * Measured, and it surprises everyone once. The router normalises the path and
 * strips a trailing slash, so `"/"` becomes the EMPTY STRING, and the prefix
 * test is then `location.startsWith("" + "/")` — true on every route in the
 * application. A root link is therefore permanently highlighted.
 *
 * `end` fixes it, and a root link is the one case where you almost always want
 * it: "Home" means the home page, not "anywhere under /". `aria-current` is
 * unaffected either way, because it was already an exact comparison.
 *
 * # What it does not do
 *
 * **No icon or badge slot.** It takes children; a caller composes whatever
 * goes inside. A slot would fix the order of things this component has no
 * opinion about.
 *
 * **No `disabled`.** A disabled link is not a thing — the element either
 * navigates or it is not a link. A destination a user may not visit is either
 * absent from the nav or present and answering with a permission error, and
 * the second is usually kinder.
 *
 * **It is not the tab component.** A row of NavLinks that changes the URL is
 * navigation and belongs in a `nav`. See `navigation/tabs/doc.ts` for the
 * distinction, which is the one most often got wrong in this group.
 */
export {};
