import { DENSITIES } from "./density";
import { THEMES } from "./theme";

/* The one place a preference is read BEFORE anything renders.
 *
 * Every other path in this tier reads storage after mount, which is correct for
 * a framework — the server has no storage, so reading during render is a
 * hydration mismatch. The cost is a frame: a user who chose dark gets a light
 * first paint and then a jump, and that is the most visible bug a theme control
 * can have.
 *
 * The fix has to run before the first paint, which means before any module
 * loads, which means it cannot import this file. So it is a STRING, injected as
 * a blocking inline script by whatever the shell is — one line in the document
 * for each sibling, and no framework named here.
 *
 * # It restates what `theme.ts` and `density.ts` already know
 *
 * Deliberately, and it is the only duplication in this tier. It cannot be
 * avoided: the whole point is to run without the bundle. What CAN be done is
 * make the drift detectable, so `boot.test.ts` runs this script and the module
 * path against the same storage and requires the same DOM out of both.
 *
 * # It makes the document disagree with what the server sent
 *
 * Deliberately — that is the whole point — but a framework that compares the
 * two on hydration will report the difference as a mismatch on the element this
 * writes to. The attributes are right and the comparison is what is wrong, so
 * whatever renders this must opt that ONE element out of the comparison. One
 * element, not a subtree: a suppression that reaches children can hide a real
 * mismatch.
 *
 * # Both defaults are the ABSENCE of an attribute
 *
 * `system` and `comfortable` are expressed by not setting anything, so the
 * script's job is only to write the two non-default values. That is why it can
 * be this short, and why it never needs to remove an attribute: on a fresh
 * document there is nothing to remove. */

const NON_DEFAULT_THEMES = THEMES.filter((t) => t !== "system");
const NON_DEFAULT_DENSITIES = DENSITIES.filter((d) => d !== "comfortable");

/** Inline, blocking, and small enough to read in the page source. */
export const RUNTIME_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem("theme");
if(${NON_DEFAULT_THEMES.map((t) => `t===${JSON.stringify(t)}`).join("||")})d.dataset.theme=t;
var n=localStorage.getItem("density");
if(${NON_DEFAULT_DENSITIES.map((d) => `n===${JSON.stringify(d)}`).join("||")})d.dataset.density=n;
}catch(e){}})();`;
