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
 * # The failure model lives here for the same reason
 *
 * `failure.ts` is vocabulary shared by the tier that PRODUCES a value and the
 * tier that RENDERS it: `lib/http` constructs a failure and a screen branches
 * on it, so it can live in neither. Its specification is `failure.doc.ts`,
 * which is a module doc rather than a tier doc — a module large enough to be
 * its own oracle gets its own, because an oracle carrying unrelated prose is
 * material a barriered writer has to be told to ignore.
 *
 * It is the reason this tier's import rule matters rather than being a slogan.
 * A failure is plain data with a structural guard and no base class, precisely
 * so that it survives a serialisation boundary — and a class imported from
 * anywhere else would be the thing that broke it.
 *
 * # What else belongs here, and does not exist yet
 *
 * Nothing has earned it. A type here with one caller belongs beside that
 * caller until it has two.
 */
export {};
