/**
 * kernel — what everything may import, and which itself imports nothing.
 *
 *     kernel  may import  nothing
 *     kernel  ✗ solid-js · http · services · components · routes
 *
 * The import rule is the whole definition. A tier every other tier may reach
 * is only safe while it reaches nothing back, and the moment it imports the
 * framework it has stopped being the kernel and become a binding that
 * everything depends on.
 *
 * # cn is five lines because the alternatives solve a problem this tree does
 * not have
 *
 * `clsx` is the same join with a dependency and an object/array API nothing
 * here uses. `tailwind-merge` exists to resolve conflicts between competing
 * utility classes — a problem created by utility classes, which this tree does
 * not have, because CSS Modules hash a class per file and two of them cannot
 * collide.
 *
 * So the whole job is: drop falsy values, join the rest with a space. The
 * function returns `""` rather than `undefined` for an empty result, because
 * `class={undefined}` and `class=""` render differently in a diff and one of
 * them is noise.
 *
 * `0` is deliberately kept rather than dropped. It is never a class name, and a
 * caller passing one has made a mistake worth seeing in the DOM rather than one
 * silently swallowed.
 *
 * # Why this is a module and not a file next to the first caller
 *
 * Because the second caller is always a different category, and the version
 * that lives beside the first one gets imported sideways — which is the
 * beginning of a `utils` directory whose import list nobody agreed to.
 *
 * # What else belongs here, and does not exist yet
 *
 * Vocabulary shared by the tier that PRODUCES a value and the tier that
 * RENDERS it. An error type carrying a kind is the clearest case: `lib/http`
 * constructs it and a screen branches on it, so it can live in neither.
 *
 * None of it is written, because none of it has two callers yet. A type here
 * with one caller belongs beside that caller until it has two.
 */
export {};
