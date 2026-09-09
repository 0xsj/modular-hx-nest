/* Read from the real file, never a copied string.
 *
 * A source block transcribed by hand is a second copy that goes stale silently
 * — and a gallery showing source that no longer matches the component beside it
 * is worse than one showing none, because it is believed.
 *
 * `?raw` is a BUILD-time import rather than a filesystem read behind a server
 * function: it reaches the same place with no request-time I/O, and a wrong
 * path fails the build rather than rendering an empty block.
 *
 * No default export — a file under `src/routes` becomes a route only if it has
 * one. */
export type Source = { path: string; code: string };

const ROOT = "components";

/** Pair a raw import with the path it came from, so the two cannot drift. */
export const source = (rel: string, code: string): Source => ({
  path: `${ROOT}/${rel}`,
  code: code.trimEnd(),
});
