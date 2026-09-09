# The current page is an exact claim; the section you are in is not

A nav has two things to say — *this is where you are* and *this is what you are
inside* — and they are true of different items at the same moment. Marking both
with one mechanism means either the parent lies about being the page, or the
parent stops looking selected while you are in it.

**Origin** — a nav link, and discovering that the router had already separated
the two while the obvious hand-written version does not.

## The two questions

```
  location   /sites/eu-west

  /sites          the section you are IN       highlighted, not current
  /sites/eu-west  the page you are ON          highlighted AND current
```

`aria-current="page"` is a claim about identity. Putting it on `/sites` tells a
reader they are on the Sites page, so somebody navigating by that announcement
goes looking for content that is not there — and it is a particularly bad lie
because it is *nearly* true.

The highlight is a different thing: a visual statement about which branch of
the tree is open. It is allowed to be a prefix match, because that is what
"inside" means.

**So the implementation that feels obvious is wrong**: comparing the href to
the pathname and writing `aria-current` from the result implements exactly one
of the two questions and uses it for both. Whichever you pick, the other
behaviour disappears — and nobody reports it, because the nav looks right.

## Style from the attribute, not from a second flag

Once the two are separated, the current-page styling should select
`[aria-current="page"]` rather than a class set from the same condition.

A class and an attribute written from one condition are two copies of a fact,
and copies drift — a refactor moves one, and the screen then shows one item as
current while a reader is told about another. Selecting the attribute makes the
mark and the announcement the same condition rather than two agreeing ones.

The same reasoning applies wherever a library exposes state as an attribute:
key the styling off `[data-selected]`, `[aria-selected]`, `[aria-pressed]`, and
the look cannot disagree with what is announced.

## `aria-current` is not only "page"

The attribute takes a token, and the token is the claim's *kind*: `page`,
`step`, `location`, `date`, `time`, or bare `true` when none of those fit. A
breadcrumb's last item is `page`; the current step in a wizard is `step`. Using
`page` for all of them is the same over-claiming in miniature.

## Exactly one, and it is worth enforcing

There should be one current-page claim per page. That is easy to state and easy
to break by composition: two components that each mark their own current item
produce two, and neither is wrong locally.

It is also cheap to check on rendered output — count the elements carrying the
attribute — which is the kind of assertion worth making about a page rather
than about a component, because the defect only exists once they are combined.

## Gotchas

**A link to the page you are already on should not be a link.** It is an
affordance that does nothing: announced as a link, reachable by tab, and
pressing it reloads. Render it as text with the attribute, and the trail has as
many tab stops as it has places you can actually go.

**"Highlighted" and "current" drifting apart is the correct end state.** If a
design insists the parent look identical to the current page, the design is
asking for the announcement to be wrong; the fix is visual, not semantic.

**The claim is about the document, so nesting matters.** A component cannot
know whether something else on the page has already claimed the current page,
which is why the check belongs to a page-level audit.

## Used in

`src/components/navigation/nav-link/` — no `aria-current` of its own, styling
selected from the attribute; and `src/components/navigation/breadcrumb/`, whose
last step is text carrying `aria-current="page"` rather than a link.

## Related

- [[the-routers-link-has-three-opinions-you-inherit]]
- [[containment-is-not-naming]]
- [[a-distinction-survives-only-if-the-renderer-requires-it]]
