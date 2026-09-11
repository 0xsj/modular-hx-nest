/**
 * Input — a text control that owns nothing but itself.
 *
 * # `size` is taken over, deliberately
 *
 * The platform's `size` attribute on an input means "width in characters",
 * which is a layout decision expressed in the wrong unit and almost never what
 * anybody wants. It is omitted from the props and the name reused for the
 * control-height scale, matching every other primitive here. A caller who
 * genuinely wants character-width sets it in CSS, where widths belong.
 *
 * # The invalid style keys off the ARIA attribute, not a class
 *
 * `[aria-invalid]` in the stylesheet rather than an `invalid` variant. One
 * source of truth: a control that announces itself invalid also looks it, and
 * there is no way to have one without the other. An `invalid` prop that set only
 * a class would be exactly the silent-wiring-loss `protocols/accessibility.md`
 * is about.
 *
 * That attribute comes from `Field`, which is where the error lives.
 *
 * # No label prop
 *
 * A `label` prop here would put two labelling mechanisms in the tree and make
 * the wrong one convenient. `Field` owns the label, the hint and the error, and
 * hands this control the attributes that connect them.
 */
export {};
