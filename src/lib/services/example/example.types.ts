/** The smallest shape that still exercises every rule. */
export type Item = { id: string; name: string; host: string };

/** What a caller supplies to create one. Deliberately not `Partial<Item>`: an
 *  id the server assigns is not a field the caller may omit, it is a field the
 *  caller does not have. */
export type NewItem = { name: string; host: string };

/** How this backend signals that a legitimately-optional thing is absent.
 *
 *  A bare 404 cannot carry that meaning — it also means *wrong path* — so the
 *  server tags the one it means, and `findDefaultItem` recognises only that tag.
 *  A 404 without it is a fault, not an emptiness. */
export const NO_DEFAULT = "no_default_item";
