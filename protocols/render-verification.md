# Render verification

> **Read the render with a program rather than with an opinion — and when that
> is not possible, say which half was looked at.**
> Use before claiming a screen is done, after a visual pass that found nothing,
> when a form builds clean and behaves wrong, or when a theme, a contrast ladder
> or a focus style "looks fine". Ends in a measurement, not a screenshot.

**Adopt this when** a screen carries small text, a theme, a form, or any state
that only exists after hydration. **It costs you** one render, one measurement
and one pass of fixes — roughly forty lines of throwaway script per property,
run two or three times. **Decline it** for a page whose only claim is layout at
rest; a screenshot answers that honestly, and this protocol has nothing to add.

---

## The rule

Looking at a screenshot is not a measurement. The gap between the two is widest
exactly where it matters least to a glance and most to a reader: **small text
carrying information.**

The eye confirms a label *exists* and moves on. Contrast is a ratio and the eye
has no scale for it, which is why this failure clusters on 10px timestamps and
axis labels and never on body copy — nobody misjudges body copy.

```
  origin   a contrast fault survived TWO deliberate visual passes over the same
           screenshots, then fell out in one pass when the pixels were sampled
           and the ratios computed

           --ink-4    before   light 2.81:1   dark 2.72:1
                      after    light 5.10:1   dark 5.60:1
```

Roughly forty lines: decode the PNG, defilter the scanlines, take the extreme
luminance in each text region, compute the WCAG ratio. It caught a second fault
the same afternoon.

---

## Four things to verify, and the instrument for each

| What you are claiming | Instrument | Fails silently as |
| --- | --- | --- |
| a colour is legible | sample pixels, compute the ratio | a colour |
| a form works | drive it and read the accessible output | a form that renders |
| a control respects existing state | load the **hydrated** page and sample | a flash you blame on CSS |
| a design system page is true | make the page compute its own claims | a tidy, authoritative picture |

### 1 · Measure the colour, not the impression

Decode, sample the region **the claim is about**, compute the quantity the design
promises. The same move works past pixels: a stylesheet that must contain a
guarded media query can be fetched from a running server and asserted; a chart
that must place N labels can report how many it placed.

- **Antialiasing under-reads the token.** Sampling the darkest pixel of a 10px
  glyph gives a worse ratio than the colour actually specifies, so a measured
  pass is *conservative*. Check the token value too, or a correct design gets
  tuned to satisfy the measurement of its own edges.
- **A measurement of the wrong thing is more confident than a glance.** Sampling
  a panel edge instead of the glyph answers a question nobody asked, with three
  decimal places.

### 2 · Drive the form, do not screenshot it

A form that renders correctly, hydrates, and does nothing on submit is
indistinguishable from a working one in every static check and every screenshot.

A screenshot answers *what does the initial state look like*. Everything
interesting about a form is a **transition** — idle → pending → error → cleared —
and none of those exists on first paint:

```
  an action module that throws on instantiation   the page still renders
  a form that falls back to a native POST         the page still renders, refreshed
  an error that lands on the wrong field          looks like an error
  a live region that never announces              looks identical
```

```
  origin   four auth screens that built clean, rendered clean in both themes,
           and silently failed on every submission. Three defects; the picture
           showed none of them
```

Rules that make the probe trustworthy:

- **Select inputs by `name`, never by index.** Frameworks inject hidden inputs
  into a form with an action, so `inputs[1]` is not the second field. The first
  version of this probe overwrote an action id and concluded the form was dead.
- **Set values the way the framework will notice.** A direct `el.value = v` is
  ignored by a change tracker, so the framework never sees the value. Use the
  native property setter and dispatch a bubbling `input` event.
- **Count document loads.** A second load means the form navigated, which means
  the action did not run. That one counter turns the most confusing failure into
  an obvious one.
- **Assert on the accessible output, not on class names.** Live regions,
  `aria-invalid`, and `id$="-error"` text are what a person actually receives,
  and they survive restyling.
- **Wrap the run in try/catch and always set a result.** An unhandled rejection
  in an async handler produces silence, which reads as "the probe did not run"
  and costs a cycle to distinguish from "the page did not respond".

> **Framework note.** The value-setter and hidden-field details differ per stack;
> the *rule* does not. Establish once, per project, how a value is set so the
> framework sees it, and write it at the top of the probe. Where events are
> delegated and synthesised — React derives `mouseenter`/`mouseleave` from
> `mouseover`/`mouseout`, because the former do not bubble — a synthetic event of
> the wrong name reaches nothing and reports working hover as broken.

### 3 · Verify the hydrated page

A control that writes its own state to the document on mount erases whatever was
already there, and does it *after* first paint, so the page visibly flips.

```
  origin   a theme toggle. data-theme="light" was set on <html> before
           hydration; the toggle's mount effect removed it, and the page turned
           dark about forty milliseconds later
```

This is the failure class that defeats every check that does not run JavaScript —
the stylesheet is right, the server-rendered HTML is right, a static probe
computes the right value. **Only the hydrated page is wrong.** So the render that
gets measured must be the running one, and the answer comes from a sampled pixel
rather than from looking.

The distinction to check for is `adopt` versus `assert`: does the component read
the document's value on mount and write only on intent, or does it write its own
default on every mount? The second is one line shorter and almost always wrong.

### 4 · Make the showcase assert

A design system page that only *displays* is a page whose claims are checked by
whoever happens to look at it, which is the same as not checked. A swatch grid is
a picture of a decision, and pictures do not fail.

Three moves, each replacing something a person was supposed to notice:

```
  the nav          derived from the same array the page composes
  the code blocks  read off disk, not pasted
  the colours      measured against their surfaces, both themes, printed
```

```
  origin   a hand-maintained nav stale at seven links of twelve, and a colour
           ladder whose bottom step sat at 2.81:1 after two visual reviews
```

**The limit, stated rather than implied:** the pairs a contrast audit checks are
a hand-written list. A pair used on a real screen and absent from that list is
unaudited, and nothing detects that. The audit is only as good as its list — so
report, and do not let a green badge imply completeness.

---

## The instrument is a program, and it has bugs

**When a probe reports something surprising, the first hypothesis is the probe.**
The cheapest test is a second measurement that would have to fail differently.

Two false bugs from one session, both in the instrument:

- **`:focus` never matches in headless Chrome.** `element.focus()` sets
  `document.activeElement` and the CSS rule still does not apply, because the
  *document* lacks system focus. A correct skip-link style measured as broken.
  Puppeteer and Playwright handle this; a hand-rolled CDP driver needs
  `Emulation.setFocusEmulationEnabled`. Note that `activeElement === el` was
  already in the output that claimed the rule was broken — the evidence that the
  page was fine was sitting in the report.
- **A stale browser on a fixed debugging port.** A previous run's browser
  survived `child.kill()`, the new run attached to it, and the old profile's
  `localStorage` made a fresh page look pre-configured. Kill whatever holds the
  port before launching.

**Prefer a driver that already solves these.** Hand-rolling CDP is how you meet
both traps; the traps are documented here because the driver choice is
occasionally forced, not because hand-rolling is recommended.

### The negative control

**Give every harness one case whose outcome must be the opposite, checked before
anything else is trusted.** A measurement that cannot pass. A probe result that
cannot be green. It costs one run and it catches the whole class.

**A uniform result is the tell.** 12 of 12, 52 of 52, 100%. A real suite against
real code rarely produces one; a harness that never ran produces one reliably,
because nothing varies when nothing executes. Treat a perfect score as a reason
to check the instrument, not as a reason to stop.

---

## Not everything is measurable, and saying so is the point

A browser flag that should force a colour scheme silently did nothing, so one
theme was verified by asserting the stylesheet and the other by looking. **Both
are legitimate. A report that does not say which was which is the problem.**

Write the split down:

```
  light   measured  — sampled, ratios computed
  dark    asserted  — stylesheet fetched and matched; NOT rendered
```

A null result is a result. "This could not be measured, and here is what was done
instead" is a finding; silence in the same place is a claim you did not make and
cannot support.

---

## Cost control

**Do not build a loop out of it.** One render, one measurement, one pass of
fixes. Re-rendering after every edit spends the session re-checking what a
careful change already settled.

**A probe is not a test suite, and should not pretend to be.** It runs by hand
and asserts nothing on its own — that is the point rather than a shortcoming. A
probe is what you write when you need an answer once; a suite is what you write
when you need the answer *again*. Reaching for the second before you have needed
the first twice is infrastructure ahead of a regression.

Most probes here were deliberately not committed: they lived in a scratch
directory for the length of a session and were deleted. What survives is the
finding and the fix, not the instrument.

---

## Checklist

```
  [ ] every text token measured against its surface, both themes
  [ ] the measured value cross-checked against the token value (antialiasing)
  [ ] every form driven, not screenshotted — submit, error, and cleared
  [ ] the assertion reads accessible output, not class names
  [ ] the page under test is the HYDRATED one for any document-owned state
  [ ] the showcase computes its claims rather than displaying them
  [ ] the audit list is written down, and its incompleteness stated
  [ ] a negative control ran and failed as required
  [ ] anything not measurable is named, with what was done instead
```
