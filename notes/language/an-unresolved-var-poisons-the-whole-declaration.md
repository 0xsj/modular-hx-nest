# An unresolved `var()` poisons the whole declaration, not just its slot

A fallback stack written after `var(--missing)` never runs, because the
declaration is already invalid before the browser reaches the rest of it — which
is how a font stack with five fallbacks renders as Times.

**True of CSS custom properties generally · measured in Chrome, 2026-09-08.**

**Origin** — a template with no font pipeline. The token layer had been ported
from a project whose framework always defined the hook:

```css
--font-sans: var(--font-sans-src), ui-sans-serif, system-ui, -apple-system, sans-serif;
```

Nothing defined `--font-sans-src`. The page rendered in the UA default serif,
and `--font-sans` read back as the empty string.

## Why

Custom property substitution happens at computed-value time. An unresolvable
`var()` with no fallback makes the property **invalid at computed-value time** —
and IACVT applies to the *whole declaration*, not to the one token that failed.
The property takes its inherited value if it is inherited and its initial value
otherwise. The four fallbacks after the comma are never considered, because
there is no longer a declaration to consider them in.

Then it propagates: `font-family: var(--font-sans)` is now substituting an empty
value, so that declaration is invalid too, and the element falls back to
whatever the UA says.

The fix is one character of punctuation — put the fallback **inside** the
`var()`:

```css
--font-sans: var(--font-sans-src, ui-sans-serif), system-ui, -apple-system, sans-serif;
```

## Gotchas

**It works perfectly everywhere the hook is defined.** So it ships from a
project that has a font pipeline into one that does not, and the bug arrives
with the copy rather than with the edit.

**Nothing warns.** No console message, no lint rule, and the stylesheet is
valid — the failure is a runtime resolution, not a syntax error.

**The tell is the empty string.** A custom property that reads back as `""`
rather than as its literal text has been poisoned. Reading the property is a
better check than looking at the render, because the render just looks like
somebody chose a serif.

**A "hook" property is the pattern most exposed**, because being undefined is
its normal state rather than an error. Every hook needs its fallback inside the
`var()`, and the one place that is easy to forget is the first slot of a list.

**A screenshot will not find this.** A page in Times looks deliberate.

## Used in

`src/styles/tokens/typography.css` — both `--font-sans` and `--font-mono`.

## Related

- [[a-measurement-of-the-wrong-thing-is-confident]]
