/**
 * Table — real table semantics, and the two things everybody gets wrong.
 *
 * # A grid of divs is not a table
 *
 * The markup is `table`/`thead`/`tbody`/`tr`/`th`/`td` because those elements
 * carry a navigation model nothing else does. A reader in table mode moves cell
 * by cell and hears the relevant header announced with each value — "Region,
 * EU-West; Cameras, 12" — so a cell in the middle of a wide table is
 * intelligible on its own. Divs with `display: grid` produce the same picture
 * and none of that: the user hears a flat run of numbers with no idea which
 * column they came from.
 *
 * `role="grid"` on divs can rebuild it, at the cost of reimplementing keyboard
 * interaction that the platform already ships correctly.
 *
 * # `scope` is mandatory, and it is the first thing dropped
 *
 * Without it a header is ambiguous: a reader cannot tell whether `th` names
 * its column or its row, and in a table with both — a matrix — the
 * announcement becomes wrong rather than merely absent. `Th` therefore
 * defaults `scope="col"` instead of leaving it off, so the common case is
 * correct by default and the row case is one prop.
 *
 * # The scroll wrapper is a separate, FOCUSABLE element
 *
 * Two reasons it cannot be on the table itself. A `table` that is its own
 * scroll container loses sticky headers and interferes with its own layout
 * algorithm; and more importantly a scrollable region that is not focusable
 * cannot be scrolled from the keyboard at all, so every column past the fold
 * is unreachable without a pointer. `tabindex="0"` with `role="region"` and
 * the caption as its name is what makes the overflow operable and findable.
 *
 * That is also why `caption` does double duty: it is the table's own name and
 * the scroll region's label.
 *
 * # A caption, not just a heading above
 *
 * A heading in the page names the table for someone reading top to bottom. A
 * reader jumping directly between tables gets none of that context, and the
 * caption is what they land on. It is cheap and it is the difference between
 * "table with 6 columns" and "Cameras by site, table with 6 columns".
 *
 * # `numeric` goes on the header as well as the cell
 *
 * A number column is read by comparing digits down the column, so it is
 * right-aligned with tabular figures. Aligning only the cells leaves the label
 * floating away from the figures it names, which is the version that looks
 * broken. One prop, applied at both ends by the caller.
 *
 * # What it does not do
 *
 * **No sorting, no selection, no pagination, no column resizing.** Each is
 * state plus a handler, and a component that owns them has decided where the
 * data lives. Sorting in particular needs `aria-sort` on the sorted header and
 * a live announcement of what changed, which is a decision about the whole
 * screen. This is the presentational half; a sortable table composes it.
 *
 * **No sticky header.** It requires a known scroll container and a height the
 * caller owns. Available to a screen in one rule; wrong to bake in.
 *
 * **No zebra striping.** Alternating fills fight the row hover and the
 * selected state, and the border between rows already does the job at this
 * density.
 */
export {};
