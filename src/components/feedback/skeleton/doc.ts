/**
 * Skeleton — a shape standing in for content that has not arrived.
 *
 * # It is decorative, and therefore it is not a loading state
 *
 * This is the whole of it, and it is the thing that is most often got wrong.
 * A skeleton is `aria-hidden`: it is a picture of a paragraph, and reading
 * "blank blank blank" to somebody is worse than reading nothing.
 *
 * The consequence is that **a screen full of skeletons announces nothing at
 * all.** A reader is told the page is loaded, finds no content, and has no way
 * to know whether to wait or to leave. The skeleton has replaced the
 * announcement with a picture of one.
 *
 * So a caller that uses this must ALSO say what is happening, and the
 * component deliberately does not do it for them, because the right way
 * depends on the shape of the screen:
 *
 *     aria-busy="true"  on the region being replaced — the usual answer
 *     a live region     that says "Loading cameras" and later the result
 *     a visible label   beside the skeletons, which serves everyone
 *
 * Building any one of those in would make the wrong one automatic, and the
 * failure would be silent — which is exactly the state this whole group
 * exists to prevent.
 *
 * # Loading is not the third state
 *
 * "Still waiting" and "came back with nothing" are different facts, and so are
 * "waiting" and "the request failed". A skeleton that is still on the screen
 * after a failure is the specific bug that produces a page loading forever:
 * nothing is wrong, visibly, and nothing will ever change.
 *
 * `lib/kernel`'s three states are about a SETTLED result. This is the state
 * before there is one, and it must resolve into one of them rather than
 * standing in for a state that never came.
 *
 * # The animation stops entirely under reduced motion
 *
 * Not a shorter duration — none. The motion tokens collapse durations to zero
 * for transitions, and that is the right treatment for a one-shot movement,
 * but an infinite loop is a different case in two ways: it is the kind of
 * motion that cannot be waited out, and a zero-duration animation repeated
 * indefinitely is a bug rather than a stillness.
 *
 * A shimmer in the corner of the eye is a common trigger for vestibular
 * disorders, and a page of them is a page of triggers.
 *
 * # Shape
 *
 * **It fills its container by default.** A skeleton should be the size of the
 * thing that is coming, and the container already knows that size — passing a
 * width usually means the parent is the wrong element.
 *
 * **`SkeletonText`'s last line is short.** Real paragraphs end mid-line. A
 * stack of equal-length bars reads as a table, which is a promise about the
 * content that is about to be broken.
 *
 * # What it does not do
 *
 * **No `count` on the base component.** Repetition is the caller's `For`, over
 * the caller's data shape, and a `count` prop invites a skeleton list whose
 * length has nothing to do with the list that replaces it.
 *
 * **No delay.** A skeleton that appears only after 200ms is good practice and
 * is a decision about a REQUEST — it belongs where the request is, next to the
 * retry policy, not inside a rectangle.
 */
export {};
