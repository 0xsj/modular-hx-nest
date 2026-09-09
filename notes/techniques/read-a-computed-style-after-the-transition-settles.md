# Read a computed style after the transition settles, or you are reading an interpolation

The tell that a probe caught a transition mid-flight is that the number it
reports is not any value in the stylesheet — and the first hypothesis for a
surprising measurement should always be the instrument.

**Origin** — a landing page's light theme. A screenshot showed a button as a
grey slab on a near-white ground, which looked like a token that had not
applied.

## What the measurement said, and why it was wrong

First reading, immediately after stamping `data-theme="light"`:

```
  --surface-panel token   #ffffff          <- the theme HAD applied
  button background       rgb(24, 24, 24)  <- the dark value
```

Which reads as: the tokens updated and the element did not. That is not a thing
CSS does, and the next reading said why:

```
  after switching to dark:
    background  rgb(132, 132, 132)
    color       rgb(138, 138, 138)
```

Neither is any value in the file. They are tweens. The control carried a
120ms colour transition and both reads happened inside it — the first caught the
start (still dark), the second caught the middle.

After a settle:

```
  light   rgb(255, 255, 255)   correct
  dark    rgb(24, 24, 24)      correct
```

No stylesheet change was needed. The measurement was the only thing broken.

## Why it is worth writing down

**The failure direction is the expensive one.** It reports a correct stylesheet
as broken, which invites a fix to code that is right — and a "fix" that lands on
correct code is worse than no measurement, because the original is now gone.

## Gotchas

**The tell is a value you did not write.** If the number is not in the palette,
you are reading a tween rather than a state. That check costs nothing and it is
what separates this from a real defect.

**A fixed delay is the crude fix.** Awaiting `transitionend` is precise, and it
does not fire when nothing was transitioning — so a probe that waits for it
unconditionally hangs on the case where the value was already correct.

**It disappears under reduced motion.** A reset that pins durations to near-zero
removes the window entirely, so this reproduces on some machines and not others,
and never on a machine configured for accessibility.

**It compounds with a screenshot.** A frame captured mid-transition is a picture
of a colour nothing specifies, and a picture is exactly what does not carry the
evidence that it was mid-transition.

## Used in

The landing-page verification for `src/routes/index.module.css`; the same
discipline applies to every probe written under
[`protocols/render-verification.md`](../../protocols/render-verification.md).

## Related

- [[an-observer-that-watches-what-it-renders-needs-a-key-guard]]
- [[an-unresolved-var-poisons-the-whole-declaration]]
