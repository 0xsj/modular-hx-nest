# The CSSOM drops declarations a stylesheet keeps

An inline style goes through property-by-property validation and silently
discards what the engine does not recognise; the same declarations written in
CSS are just text and survive. So a rule that works in a stylesheet can vanish
when moved to a `style` object, leaving the half that happens to be recognised.

**True of the CSSOM generally · verified 2026-09-09 under happy-dom 20.14.0 —
measured there; the mechanism is the platform's, not the test environment's.**

**Origin** — a line clamp built as an inline style. Four declarations went in
and one came out.

## What was measured

```js
style={{ display: "-webkit-box", "-webkit-box-orient": "vertical",
         "-webkit-line-clamp": "2", overflow: "hidden" }}

// element.getAttribute("style")  ->  "overflow: hidden;"
```

`display: -webkit-box` is dropped because the VALUE is unrecognised;
`-webkit-box-orient` and `-webkit-line-clamp` because the PROPERTIES are. Only
`overflow` survived — and `overflow: hidden` with no clamp is a element that
hides its overflow and shows one line, which looks like a clamp that is set to
the wrong number rather than one that is absent.

Nothing throws. There is no warning. The style attribute simply contains less
than was written.

## The fix, and why it is better anyway

Put the declarations in the stylesheet and pass only the VARIABLE part inline,
as a custom property:

```css
.clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--text-clamp-lines, 2);
  line-clamp: var(--text-clamp-lines, 2);
  overflow: hidden;
}
```

**A custom property is never dropped.** It has no schema to fail — any
`--name` is valid and holds any token sequence — which is exactly why it is the
right channel for a value crossing from a component into CSS.

The arrangement is better for a second reason: prefixed and unprefixed
declarations can sit side by side in the cascade, each ignored where unknown,
which is the mechanism they were designed for and one an object literal cannot
express at all.

## Gotchas

**The survivor is the dangerous part.** If every declaration were dropped the
element would look obviously unstyled. One survivor produces something
plausible, and plausible is what gets shipped.

**This is not only a simulated-DOM problem.** Browsers validate inline styles
too — the specific set they accept differs, which is worse: a rule can work in
the browser you developed in and be dropped in another, with no error in
either.

**Setting a property with a dash goes through `setProperty`, which is the same
validation path.** The framework's style handling does not change the outcome;
it is the CSSOM underneath.

**Anything vendor-prefixed, experimental, or newly shipped is a candidate.**
The rule of thumb: if a declaration needs a prefix or a fallback pair, it wants
to be in a stylesheet.

## Used in

`src/components/typography/text/` — the `.clamp` class carries the
declarations, `--text-clamp-lines` carries the count, and a source assertion in
`typography.test.tsx` pins the declarations that cannot be observed through the
CSSOM.

## Related

- [[an-unresolved-var-poisons-the-whole-declaration]]
- [[a-style-object-is-applied-in-insertion-order]]
- [[a-check-that-cannot-fail-is-not-a-check]]
