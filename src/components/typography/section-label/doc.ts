/**
 * SectionLabel — the small uppercase mark above a group.
 *
 * # It is a `div` by default, and that is a claim about the outline
 *
 * This mark appears above stat groups, table columns, menu groups and form
 * sections. Most of the time it is a VISUAL grouping device — it separates
 * things on the screen and adds nothing a reader needs, because the group is
 * already conveyed by a list, a table, or a fieldset.
 *
 * Making it a heading by default would put every one of them into the document
 * outline. A reader navigating by headings then gets a list of a dozen
 * two-word fragments, which makes the outline useless for the thing it is for:
 * finding the section you want.
 *
 * So it renders a `div`, and `as="h2".."h6"` is there for the case where the
 * label genuinely NAMES a region that a reader should be able to jump to. That
 * is a deliberate decision, made per use, which is the point.
 *
 * # The uppercase is CSS, not the string
 *
 * `text-transform: uppercase` changes the rendering and not the text, so the
 * accessible name stays in the case it was written in. Typing "RETENTION" into
 * the markup instead is how a reader ends up spelling it out letter by letter,
 * because some assistive technology treats a fully-capitalised word as an
 * acronym.
 *
 * It is also why the tracking is opened up here: uppercase letterforms have no
 * ascenders or descenders to separate them, so at this size they set too tight
 * without it.
 *
 * # Why a component rather than a class
 *
 * Because the decision above is the whole content. A shared class would carry
 * the appearance and leave every call site to pick an element, which is
 * precisely the choice that gets made by copying whatever was nearby.
 *
 * # What it does not do
 *
 * **No `for`, no association.** Labelling a form control is `forms/label`;
 * labelling a group of them is `forms/fieldset`'s legend. This is neither — it
 * is a mark, and using it where one of those belongs produces a group that
 * looks labelled and is not.
 */
export {};
