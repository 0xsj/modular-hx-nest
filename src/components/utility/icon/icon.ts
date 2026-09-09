/* The icon set — imported here and nowhere else.
 *
 * Subpath imports rather than the barrel. Both tree-shake in a production
 * build, because the package is `sideEffects: false` and a named re-export is
 * statically analysable either way. The difference is development: the barrel
 * is one module that pulls 2,077 icon modules into the graph, and the subpath
 * form pulls exactly the ones named below.
 *
 * The subpath modules export `default`, so each line renames on the way
 * through. That is not noise — it is what makes the list a declaration of the
 * surface rather than a re-export of everything.
 */
export { default as Check } from "lucide-solid/icons/check";
export { default as ChevronDown } from "lucide-solid/icons/chevron-down";
/** Indeterminate. A dash, not a cross — a cross reads as "no" and the third
 *  state is "partly", which is a different claim. */
export { default as Minus } from "lucide-solid/icons/minus";
export { default as X } from "lucide-solid/icons/x";
