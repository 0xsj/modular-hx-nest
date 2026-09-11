/**
 * Table — native, composable tabular data.
 *
 * § CONTRACT
 * Table and its sections, rows, and cells forward native attributes. Headers
 * default to column scope. A named, keyboard-focusable region contains wide
 * tables. Numeric cells align on their digits. Footer rows and selected rows
 * have explicit presentation. SortableTh exposes aria-sort and a button; its
 * caller owns the sort, row order, loading state, and selection.
 *
 * § MECHANICS
 * Sorting behavior is a small client leaf. No column schema or table engine
 * is required; the kitchen sink composes a searchable, paginated collection.
 */
export {};
