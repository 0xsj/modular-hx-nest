/**
 * Input and Textarea — one variant set, two elements, and no wrapper.
 *
 * # Two exports rather than a `multiline` prop
 *
 * `<Input multiline>` would have to accept the union of the input and textarea
 * attribute sets on one signature, so `rows` would type-check on a text input
 * and `type="email"` on a textarea. Two functions keep both prop sets exact and
 * cost one more import.
 *
 * The STYLING is still one variant set: `multiline` adds the height and the
 * resize behaviour to the same base, so the border, the focus ring and the
 * invalid state cannot drift between them — which is the drift a separate
 * Textarea component actually produces. It is therefore an internal argument to
 * the variant function and not a caller's decision.
 *
 * # invalid is written twice, on purpose
 *
 *     aria-invalid   the announcement
 *     data-invalid   the styling hook
 *
 * They could be one — `[aria-invalid]` is a perfectly good selector. They are
 * two because the ARIA attribute is a contract with assistive technology and
 * the data attribute is a contract with the stylesheet, and collapsing them
 * means a future styling need edits an accessibility attribute.
 *
 * Neither is set by this component: `Field` derives them from its `error` and
 * hands them down. A caller using Input bare can still set either.
 *
 * # The focus ring is a box-shadow, not an outline
 *
 * `outline` cannot be given a radius that follows `border-radius` on every
 * engine, and the ring here sits outside a border that changes colour at the
 * same time. A two-pixel shadow in `--accent-tint` composites over whatever the
 * field is sitting on; an outline would need a surface colour it cannot know.
 *
 * `:focus-visible`, never `:focus` — a mouse click on a text field should not
 * paint a ring, and `:focus` cannot tell the difference.
 *
 * # Deliberately absent
 *
 * **Adornments** — a leading icon, a trailing unit. They need a wrapper
 * element, and a wrapper here would break `inline-size: 100%` for every caller
 * that does not use one. When a search field wants a magnifier, that is a
 * composition.
 *
 * **A label, an error, a description.** `Field` owns all three and hands this
 * the attributes that connect them.
 */
export {};
