# A dev server that cannot bind its port does not fail, it succeeds elsewhere

A port already in use is not an error by default — the server shifts to the
next free one and mentions it in a single line above the banner. The cost is
not the shift; it is that the address you were going to open is still serving,
and now belongs to something else.

**True of `vite` 8.1.4 with `@solidjs/start` 2 and `nitro` 3 (beta) · verified
2026-09-09 — measured.**

**Origin** — a report that a page "won't render". It rendered. Two sibling
templates of the same project were running, both default to the same port, and
both serve a route called `/kitchen-sink`. The browser was pointed at the
neighbour.

## What was measured

```
  $ pnpm dev
  Port 3000 is in use, trying another one...

    VITE v8.1.4  ready in 273 ms
    ➜  Local:   http://localhost:3001/
```

Everything about that is honest. The fallback is stated, the banner shows the
real address, nothing is hidden. And it is still how you end up on the wrong
application, because the two facts that matter are not in the output:

**The occupant answers.** `localhost:3000/kitchen-sink` returned `200` with a
complete page — a different project's, with its own section list. HTTP has no
way to say "right port, wrong program".

**The address you type is not the one printed.** A bookmark, a second tab, a
shell alias, or plain muscle memory all point at the old number. The banner is
correct and unread.

With `strictPort`, the same collision is an error and the process exits:

```
  error when starting dev server:
  Error: Port 3001 is already in use
  [ELIFECYCLE] Command failed with exit code 1
```

Also measured, and worth knowing separately: **with no port configured this
stack binds 3000, not Vite's documented 5173.** Which layer sets it was not
pinned down; the behaviour was observed directly. So reasoning from "Vite runs
on 5173" is wrong here, and any two projects on this stack collide by default.

## Why the danger scales with similarity

An unrelated service on the port is harmless — you see something obviously not
yours and move on within seconds. The confusion lasts exactly as long as the
neighbour is plausible.

Sibling repositories are the worst case, and deliberately so: held to the same
architecture, the same route names, the same page titles, the same vocabulary.
Everything that makes them comparable also makes them indistinguishable through
a browser window. The better the family resemblance, the longer the wrong app
looks like a broken version of the right one.

That inverts the usual instinct. The safe neighbour is the one that looks
nothing like you.

## Gotchas

**Being told is not the same as noticing.** The fallback line is printed once,
before the banner, and scrolls away on the first reload. Nothing repeats it,
and the banner it precedes is the part people read.

**Anything scripted against a fixed URL silently retargets.** A smoke check, a
screenshot job, an audit script — each will happily inspect the neighbour and
report on it. Measured in the same session: an accessibility sweep returned a
clean result twice because it had been handed a page that was not the subject.
A check against a server needs to assert the SUBJECT is present — a known
element, a route only this app has — before any conclusion means anything.

**`strictPort` costs a restart and buys the whole class.** Failing to start is
a complete, immediate, unambiguous signal. The alternative is a server that is
running, correct, and at an address nobody is looking at.

**Pinning without `strictPort` is barely better.** A pinned port that still
falls back reproduces the identical confusion one number along, and now with
more confidence, because the port was chosen deliberately.

**The same shape appears anywhere a tool is helpful about ports** — preview
servers, test runners with a UI, database containers, tunnelling clients. The
convenience is the hazard: a facility that quietly succeeds elsewhere is
indistinguishable from one that worked.

## Used in

`vite.config.ts` — `server.port` pinned with `server.strictPort: true`, and the
comment beside it stating that the second is the half that matters.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]]
- [[a-barrel-import-is-free-in-the-build-and-not-in-the-dev-server]]
