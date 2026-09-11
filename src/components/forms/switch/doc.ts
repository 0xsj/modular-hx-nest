/**
 * Switch — a setting that takes effect when you flip it.
 *
 * # Switch, Checkbox and Toggle look alike and are three different controls
 *
 *     Checkbox   a VALUE you are submitting. Nothing happens until the form is.
 *     Switch     a SETTING. It takes effect immediately, and there is no Save.
 *     Toggle     a BUTTON that stays pressed. It changes the view, not the data.
 *
 * The choice is not cosmetic: each announces itself differently, so picking the
 * wrong one tells a screen-reader user something untrue about what will happen.
 * A switch inside a form with a Save button is the common mistake — it promises
 * an immediate effect the form does not deliver.
 *
 * # There is no loading state
 *
 * A switch whose effect is asynchronous will be flipped back by a failure, and a
 * spinner inside the track is not enough to explain that. Make the surrounding
 * region busy and let the failure surface where failures surface. A control that
 * silently reverts is worse than one that never moved.
 */
export {};
