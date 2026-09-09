/**
 * Label — one labelling implementation, and it is a plain element.
 *
 * # Why not the headless library's
 *
 * A headless `Label` exists to add click-to-focus for controls the platform
 * does not handle natively — a div pretending to be a checkbox. Every control
 * in this group is either a real element or brings its own label part, so
 * wrapping one here would add a dependency in order to own a class.
 *
 * It is still a COMPONENT rather than a bare `<label>` at each call site,
 * because there is one place the type scale, the weight and the disabled
 * treatment are decided, and a second `<label>` styled by hand is how those
 * drift.
 *
 * # It does not generate an id
 *
 * `for` is the caller's. `Field` owns identifiers because it owns the whole
 * arrangement; here the control and the label are siblings and inventing an id
 * would mean inventing the control's too.
 *
 * # `user-select: none`
 *
 * A double-click on a label selects its text, which is never what anybody
 * wanted and is the one behaviour the platform gets wrong here.
 */
export {};
