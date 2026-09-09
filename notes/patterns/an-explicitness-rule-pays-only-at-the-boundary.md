# An explicitness rule pays only at the boundary it was written for

"Enumerate every export, never star-export" earns its keep exactly where it
converts somebody else's unbounded surface into a stated one. Applied again at
each barrel above that point it stops being a declaration and becomes a copy —
and copies of a list drift, silently, because a missing name is a build error
only for whoever imports through the barrel that lost it.

**Origin** — adding two icons to a set of four. The seam file that imports the
icon library was edited, and the build still failed with

```
  Module '"./icon"' has no exported member 'TriangleAlert'
```

naming a file that was correct. `./icon` resolved to the directory's
`index.ts`, which had copied the four names; a third copy lived in the group
barrel above it. One icon, three edits, two of which carried no information.

## The shape

An explicitness rule is a trade: more typing, in exchange for a surface that
can be read off one file. It pays when the alternative is unbounded — a
dependency exporting two thousand symbols, a wire format, a permission set.
There, the list IS the knowledge: it says which of the two thousand this
project uses, and adding a line is the moment somebody asks whether the set
already has one that means this.

Above that boundary the alternative is not unbounded. It is a list you already
wrote. Restating it adds nothing and creates the possibility of disagreement,
so:

```
  the seam that imports the library      name every export      <- the declaration
  every barrel above it                  forward it             <- no new information
```

The general form: **an explicitness rule states a fact at exactly one place —
the place where the fact would otherwise be unknowable.** Repeating it further
in does not make the codebase more explicit; it makes the same fact
maintainable in several places at once.

## The tell

Two of them, and both showed up here.

**The edit is mechanical and the same in each file.** A change that requires
identical text in three places is one declaration and two copies, whatever the
directory structure suggests.

**The error names a file that is correct.** Because the failing lookup happens
in a copy, the diagnostic points at the copy, and the file you actually edited
is fine. Time is then spent confirming that the edit landed — which it did.

## Why it is worth resisting

The instinct is good and that is the problem: the rule was adopted for a real
reason, so applying it more widely feels like applying it more thoroughly. It
takes an explicit decision to say *this rule ends here*, and without one it
spreads to every layer that could technically host it.

The cost is not the typing. It is that a set which was supposed to be countable
now cannot be counted — three lists, no single answer to "what is in use", and
no check that they agree.

## Gotchas

**A directory barrel is a resolution target, not a neutral file.** `./icon`
resolving to `icon/index.ts` rather than `icon.ts` is exactly how the second
copy came to exist without anyone deciding to write one.

**"Star-exports do not tree-shake" is not a reason here.** Both forms are
statically analysable in a modern bundler, and the package in question is
side-effect free. The argument for enumeration is about *stating the surface*,
which means it has no force where the surface is already stated.

**The same shape applies to any list that gets re-declared for a caller's
convenience** — a re-exported type union, a copied set of route names, a
constant repeated in a config. If the copy exists so that an import path looks
tidier, it is a copy.

## Used in

`src/components/utility/icon/icon.ts` names every icon; `icon/index.ts` and
`components/utility/index.ts` forward with `export *`, and the reason is
recorded in the icon group's `doc.ts`.

## Related

- [[a-barrel-import-is-free-in-the-build-and-not-in-the-dev-server]]
- [[a-check-that-cannot-fail-is-not-a-check]]
