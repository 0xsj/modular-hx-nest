/** Every cache key in one file, built by a function rather than spelled at a
 *  call site.
 *
 *  Two spellings of the same key are two caches that disagree, and the symptom
 *  is a screen that will not update after a mutation — which reads as a stale
 *  server rather than as a typo.
 *
 *  HIERARCHICAL on purpose: invalidating `items.all(ws)` reaches `items.one(id)`
 *  too, because the cache matches keys by prefix. That is why a write can
 *  invalidate one line and refresh every read of that domain.
 *
 *  The `example` entry goes when the specimen service does. */
export const keys = {
  cookbook: {
    live: (instance: string) => ["cookbook", "live", instance] as const,
  },
  session: {
    root: () => ["session"] as const,
    all: () => ["session", "sessions"] as const,
  },
  activity: {
    root: () => ["activity"] as const,
    /* The FILTER is part of the key. Two filters are two lists and must be two
       cache entries — sharing a key means switching facet shows the previous
       facet's rows until the refetch lands, which reads as a slow server rather
       than as a key that was too coarse. */
    list: (facet?: string, correlation?: string) =>
      [
        "activity",
        "list",
        { facet: facet ?? null, correlation: correlation ?? null },
      ] as const,
  },
  example: {
    root: () => ["example"] as const,
    all: (workspace: string) => ["example", "items", workspace] as const,
    one: (id: string) => ["example", "items", "one", id] as const,
    default: (workspace: string) =>
      ["example", "items", "default", workspace] as const,
  },
};
