/** Every cache key in one file, built by a function rather than spelled at a
 *  call site.
 *
 *  Two spellings of the same key are two caches that disagree, and the symptom
 *  is a screen that will not update after a mutation — which reads as a stale
 *  server rather than as a typo.
 *
 *  HIERARCHICAL on purpose: invalidating `all(ws)` reaches `one(id)` too,
 *  because the cache matches keys by prefix. That is why a write can invalidate
 *  one line and refresh every read of that domain.
 *
 *  The `example` entry goes when the specimen service does. */
export const keys = {
  example: {
    root: () => ["example"] as const,
    all: (workspace: string) => ["example", "items", workspace] as const,
    one: (id: string) => ["example", "items", "one", id] as const,
    default: (workspace: string) => ["example", "items", "default", workspace] as const,
  },
};
