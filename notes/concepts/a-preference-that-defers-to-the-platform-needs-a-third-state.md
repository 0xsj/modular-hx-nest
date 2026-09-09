# A preference that defers to the platform needs a third state

Two states cannot express *follow the system*. Ship a two-way toggle and the
first press is a one-way door: the user is pinned to a value, the product stops
tracking the platform's own switch, and there is no way back to a behaviour
they chose at the OS level and never meant to give up.

**Origin** — building a theme control over a store that already had three
states, and having to say why the third is not redundant with "whatever it
currently shows".

## The shape

```
  system   defer to the platform. The DEFAULT, and a real selection
  light    override
  dark     override
```

The mistake is reading `system` as "no choice yet" — a null the first press
fills in. It is not. It is a standing instruction: *keep matching the OS, and
change when it changes.* A two-state control silently converts that
instruction into a constant, and the conversion is invisible because at the
moment of the press the value is the same.

The cost shows up hours later, when the platform flips to dark at sunset and
the product does not. Nobody reports that as a bug caused by a toggle.

**The same shape appears well beyond themes**: language (follow the browser),
timezone (follow the device), reduced motion, reduced data, notification
sound. Anywhere the platform has an opinion and the product can defer to it,
the honest control has one more option than the thing being chosen.

And the converse is worth stating, because symmetry is tempting: a preference
the platform has NO opinion about — how dense a table should be, which columns
to show — has no third state to offer, and adding one to match is a control
with a mode that means nothing.

## The DOM mirror: absence, not a value

The distinction survives into the markup or it is lost again:

```
  system   no attribute at all      -> prefers-color-scheme applies
  light    data-theme="light"       -> overrides
  dark     data-theme="dark"        -> overrides
```

Writing `data-theme="system"` would be the two-state bug one layer down: the
media query is a FALLBACK, and a fallback only applies when nothing has
overridden it. An attribute that is always present has overridden it, whatever
its value says.

So the stylesheet's dark rules are guarded as `:root:not([data-theme="light"])`
under the media query, and stated again under `:root[data-theme="dark"]` — two
paths, because the choice can arrive from either direction.

## Gotchas

**The default must be the deferring state**, or the platform is only followed
by users who go and ask for it. A stored value of `system` and no stored value
should behave identically.

**Do not persist the RESOLVED value.** Storing "dark" because the OS was dark
at the time turns the standing instruction into a snapshot — the same one-way
door, taken by the persistence layer instead of the toggle.

**Reading the platform preference during a server render is a hydration
bug.** The server has no `matchMedia` and no storage, so it must render the
deferring default; anything else flashes and corrects itself.

**A control that owns the state cannot have two instances.** Put the value in a
store and the control becomes a view of it — two toggles on one page then agree
by construction, because neither is the answer.

## Used in

`src/lib/runtime/theme.ts` holds the three states and the absence rule;
`src/components/chrome/theme-toggle/` is the control and owns nothing;
`src/components/chrome/density-toggle/` is the deliberate counter-example with
two states and no platform to defer to.

## Related

- [[a-distinction-survives-only-if-the-renderer-requires-it]]
- [[mutually-exclusive-options-are-radios-not-toggle-buttons]]
