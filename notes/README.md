# notes

Written as the work happens, never as a documentation pass at the end. The rule
is [`protocols/notes.md`](../protocols/notes.md): **write only what the code
cannot say.**

## The module half lives in `doc.ts`, not here

This tree has no `notes/modules/`. A module note is 1:1 with a file and answers
*why does this file look like this*, and in this project that is a `doc.ts`
sitting beside the file it explains. Splitting it into a parallel directory
would put the reasoning one lookup away from the code and give a rename two
places to be wrong.

So the split is by lifespan, which is what the kind was always deciding:

```
  doc.ts, beside the code   EPHEMERAL — dies with the file it explains
  notes/                    TRANSFERABLE — carries to the next project
```

That is the ratio the protocol expects to be lopsided, and it is: in one real
corpus 1,086 of 1,166 notes were module notes and 111 were transferable. When
that project restarted, the 111 carried.

## The kinds, and what makes each go stale

```
  substrate/    this dependency, AT THIS VERSION   somebody else ships, and
                                                   nothing tells you
  language/     this language                      a language release
  techniques/   broadly                            rarely
  patterns/     this architecture                  you change architecture
  concepts/     the domain                         the domain changes
```

`substrate/` carries four obligations no other kind has: a **version stamp**, a
statement of whether it was **measured or read**, a **primary source**, and it
is written **when it bit you** rather than when the dependency was adopted. A
note written on adoption is a summary of the documentation, and the
documentation is better at that. What is worth keeping is the gap between the
documentation and the behaviour.

## Two rules that keep the corpus portable

**A module note may cite a transferable note; never the reverse.** A note in
here that names a path in this project is not transferable. Where one needs an
example it names the shape, not the file — except `Used in`, which is the
section that rots first and is therefore the one that catches rot.

**A claim line is not a title.** One sentence, before any heading, that you
could disagree with. If the claim line and the title say the same thing, the
claim line is not finished.

## Links

`[[name]]` points at another note's filename without its extension. A link that
does not resolve yet is not an error — it marks a note worth writing.
