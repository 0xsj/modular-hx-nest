/**
 * Text — body copy, with the ink ladder as a prop.
 *
 * # `as` defaults to `p`, and the alternative matters
 *
 * A `p` inside a `p` is invalid, and the browser does not error — it silently
 * closes the outer paragraph and continues, which produces a DOM that does not
 * match the JSX and layout that is wrong for no visible reason. Text inside a
 * sentence is `as="span"`.
 *
 * The list is deliberately short. `strong` and `em` are there because they
 * carry MEANING — importance and emphasis, announced by a reader — and a
 * `weight="strong"` span does not. Reaching for the weight prop when the point
 * is emphasis loses that.
 *
 * # Tones are named for role, not for lightness
 *
 * `muted` and `subtle` survive a palette retune; `grey60` becomes a lie the
 * moment it changes. There are three neutral steps rather than six because a
 * fourth level of quiet is not legible as a distinction — it just reads as
 * lower contrast, which is a different and worse thing.
 *
 * # `lines` clamps, and clamping is lossy
 *
 * The three-property `-webkit-box` incantation is the only thing that works
 * across browsers, which is why it is here rather than at every call site.
 *
 * **What this component cannot do is make the truncated text available.** A
 * clamped string is unreadable to everyone — a `title` attribute is not
 * announced reliably and is invisible on touch. So a clamp is only correct
 * when the full value is reachable some other way: a detail view, an expand,
 * a copy button. Truncating a value that exists nowhere else is deleting it
 * from the interface.
 *
 * # `overflow-wrap: anywhere`
 *
 * Not aesthetic. A long unbroken value — an id, a URL, a token — pushes a flex
 * or grid parent wider than the viewport, and nothing in the CSS mentions a
 * width, so the horizontal scrollbar has no visible cause. It is the same
 * class of failure as a flex child refusing to shrink.
 *
 * # What it does not do
 *
 * **No margin.** Spacing is the layout's, for the same reason as the
 * heading's.
 *
 * **No `measure` prop.** Capping a reading column is `layout/container`'s job
 * and belongs to the thing that owns the width, not to every paragraph inside
 * it.
 *
 * **No `truncate` boolean.** `lines={1}` says the same thing and composes with
 * the rest; a second spelling would need a rule about which wins.
 */
export {};
