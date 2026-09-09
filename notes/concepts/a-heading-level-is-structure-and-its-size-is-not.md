# A heading's level is structure; its size is appearance, and one prop cannot be both

Fuse them and the document's outline becomes a description of the type scale —
authors pick the tag that looks right, and the navigation structure a screen
reader depends on is decided by a visual decision nobody thought they were
making.

**Origin** — writing a `Heading` primitive and having to decide whether `level`
and `size` were one prop or two. They are two, and the reason generalises past
headings.

## The shape

```
  level   WHERE this sits in the document      h1…h6      structure
  size    how big it looks                     a scale    appearance
```

Every design eventually needs them apart: a card title that is the third level
of the page and should look small; a hero that is the only `h1` and should be
enormous; a sidebar label that is an `h2` in the outline and 12px on screen.

With one prop, the author picks the tag whose default size is closest and moves
on. Nothing about the page looks wrong afterwards — which is the entire problem.
Heading navigation is how a screen reader user finds anything on a long page,
and it is silently reporting the font sizes.

## A default level is worse than a required one

`level = 2` makes the common case shorter and the failure invisible: a page with
no `h1`, or one that skips `h1` → `h3`, renders identically to a correct one.
Requiring the prop makes the author state the position once, at the only moment
they know it.

The rules being asked about are small and worth stating where the prop is:

```
  one h1 per page, and it names the page
  never skip a level going DOWN — h2 then h4 is a gap
  coming back UP is fine — h4 then h2 starts a new section
```

## The corollary: not everything that looks like a label is a heading

The same separation, applied in the other direction. A small uppercase mark
above a group is usually a VISUAL device — the grouping is already carried by a
list, a table, a fieldset — and making it a heading fills the outline with a
dozen two-word fragments, which destroys the outline for the thing it is for.

So the default element for such a mark is a `div`, and promoting it to a
heading is a per-use decision. **An outline is only useful if it is sparse.**

## Gotchas

**The demonstration is where this gets broken.** A catalogue page showing all
six levels renders a second `h1` and breaks its own page's outline — measured,
on the page documenting this rule. Showing 2–6 and saying why 1 is absent
teaches more than showing all six.

**`text-transform: uppercase` is not the same as typing capitals.** The
transform changes rendering only, so the accessible name keeps its original
case; a fully-capitalised string in the markup is read letter by letter by some
assistive technology, which treats it as an acronym.

**Counting headings is a page-level check, not a component one.** Exactly one
`h1`, and no skipped levels, are properties of the assembled document — no
component can know either. It is cheap to assert on rendered output and
impossible to assert in a unit test.

## Used in

`src/components/typography/heading/` — `level` required and separate from
`size`; and `src/components/typography/section-label/`, which renders a `div`
by default for the corollary above.

## Related

- [[the-current-page-is-an-exact-claim]]
- [[containment-is-not-naming]]
- [[a-check-that-cannot-fail-is-not-a-check]]
