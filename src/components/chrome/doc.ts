/**
 * chrome — the product's own furniture.
 *
 * # What makes something chrome
 *
 * Not "it appears on every page" — a `Panel` does that too. Chrome is what
 * belongs to the PRODUCT rather than to the content: its name, and the
 * controls over how the whole application is displayed.
 *
 * The practical test: **would a different product using this template replace
 * it rather than reuse it?** The mark, yes — it is theirs. A button, no.
 *
 * That is also why this group is the one most likely to be deleted from a
 * clone, and why the product name lives in exactly one exported constant.
 *
 * # These controls own no state
 *
 * `lib/runtime` owns the theme and the density. It is framework-free by
 * design, so the machines and the persistence are identical across the sibling
 * templates and only the binding differs. These components are the CONTROL —
 * they read the store and call it, and nothing here remembers anything.
 *
 * The consequence worth stating: two theme toggles on one page stay in step,
 * because neither of them holds the answer.
 *
 * # `system` is a choice, not the absence of one
 *
 * Three states, and this is the group where that rule is most easily lost:
 *
 *     system   follow the OS. The DEFAULT, and a real selection
 *     light    override, explicitly
 *     dark     override, explicitly
 *
 * A two-state toggle cannot express the first. Once a user has pressed
 * anything they are pinned to a value, and the product stops following the
 * platform's own light/dark switch — which is a behaviour they chose at the
 * OS level and did not intend to give up by touching a toggle once.
 *
 * On the DOM side the same distinction is why `system` is the ABSENCE of
 * `data-theme` rather than `data-theme="system"`: the stylesheet's
 * `prefers-color-scheme` query is the fallback, and it only applies when
 * nothing has overridden it.
 *
 * # Why the theme and density controls are separate components
 *
 * They have the same shape and could take a config. They are separate because
 * they answer to different stores, are wanted in different places, and one of
 * them is far more likely to be deleted — density is a preference many
 * products do not offer, and it should be removable without touching the
 * theme.
 *
 * Both compose `Segmented`, which is where the shared shape actually lives.
 * That is the right place for it: one control, two callers, no configuration
 * object describing which store to talk to.
 */
export {};
