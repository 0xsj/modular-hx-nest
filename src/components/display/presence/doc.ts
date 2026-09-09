/**
 * Presence — all three states of a measurement, and no way to skip one.
 *
 * # The type is the enforcement
 *
 * `lib/kernel` produces the distinction — `optional` keeps *nobody looked* and
 * *looked and found nothing* apart, and `presenceOf` turns a `Result` into the
 * three-way value. All of that is undone by one render:
 *
 *     {items.length ? <List items={items} /> : "—"}
 *
 * which collapses the failure into the emptiness and prints a dash about a
 * request that never came back. The kernel cannot prevent that; a component
 * whose props require all three branches can.
 *
 * So `empty` is REQUIRED. Not because a default is hard to write, but because
 * every default that could be written is wrong: "No data" is the same sentence
 * on every screen, so a person who has landed on the wrong one cannot tell.
 * The caller knows what is missing and has to say so.
 *
 * `unmeasured` is optional and defaults to a plain statement, because there IS
 * a correct generic sentence for that case — nothing was measured, and the
 * user is not being told a number that does not exist.
 *
 * # The default never prints the failure's message
 *
 * `Failure.message` is diagnostic. It is the server's words or ours, written
 * for whoever reads the logs, and it arrives in someone else's voice and often
 * someone else's language, about an internal noun. Putting it on a screen is
 * the commonest way an internal identifier reaches a user.
 *
 * The failure is passed to the `unmeasured` callback so a caller can switch on
 * `kind` and write a real sentence — "you do not have access to this site" —
 * in the product's voice. That switch belongs to the product, not here.
 *
 * # `children` is a function, and that is not a style choice
 *
 * It receives `T`, narrowed. A node child would have to be built by the caller
 * before the state is known, which means reaching into a value that may not be
 * there — the exact access the three states exist to prevent. The function
 * makes the found branch the only place `value` exists.
 *
 * The `when` prop takes the NARROWED VALUE rather than a boolean, so the
 * accessor handed to the callback carries the type. A boolean `when` discards
 * the narrowing and forces a cast, and a cast in the one component whose job
 * is exhaustiveness would be quietly funny.
 *
 * # The name collides with the kernel's type, deliberately
 *
 * `~/lib/kernel` exports the type `Presence`; this exports the component. They
 * are the same concept either side of a render, and giving the component a
 * second name would hide that. A file that needs both aliases one — which is
 * a one-line cost paid by the rare caller rather than a worse name paid by
 * every reader.
 *
 * # What it does not do
 *
 * **No loading state.** Pending is not one of the three: it is the state of a
 * REQUEST, and this takes a settled result. A component that accepted both
 * would let "still loading" and "came back empty" share a branch, which is the
 * same collapse one tier down.
 *
 * **No retry.** Retrying is a decision about a specific operation and it needs
 * a handler this component would have to manufacture. The failure is handed
 * over; what to offer about it is the screen's call.
 */
export {};
