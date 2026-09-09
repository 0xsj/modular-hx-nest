# An id that survives hydration is positional, not sequential

`createUniqueId` does not hand out numbers from a counter — it derives the id
from where the call sits in the component tree, which is why the client
reproduces the server's ids without anything being transmitted. A counter
cannot do this, and the reason is not that it restarts: it is that on a server
one counter is shared by every request in the process.

**True of `solid-js` 1.9.14 · verified 2026-09-09 — measured by executing both
builds, plus the source of the derivation. The end-to-end hydration of a live
page was NOT executed; see the limit at the bottom.**

**Origin** — a `Field` that mints an id to wire a label to a control. The
comment beside it asserted hydration stability, and the assertion had never
been checked. Everything in this note is what checking it produced.

## What was measured

The two builds ship the same derivation, byte for byte:

```js
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
```

and the entry points differ only in what they do without a context:

```js
// server
createUniqueId = () => sharedConfig.getNextContextId()          // throws if no context

// client
createUniqueId = () => sharedConfig.context
  ? sharedConfig.getNextContextId()
  : `cl-${counter++}`                                            // module counter
```

Importing both builds into one process and giving them the same context state
produces the same strings:

```
  context { id: "", count: 0 }
    server   0 1 2 3 4 5 6 7 8 9 a10 a11
    client   0 1 2 3 4 5 6 7 8 9 a10 a11     identical

  context { id: "0010", count: 0 }
    both     00100

  client with no context    cl-0, cl-1
  server with no context    throws: "getNextContextId cannot be used under
                                     non-hydrating context"
```

And `hydrate()` seeds exactly the state the server began from:

```js
sharedConfig.context = { id: options.renderId || "", count: 0 }
```

Both branches are observable in this project. The server-rendered page carries
ids like `000001001000001000000005000205210`; the same components rendered
client-only under the test runner produce `cl-0`, `cl-2`.

## Why positional and not sequential

An id that has to match across two machines cannot be *allocated*, because
allocation depends on how many were allocated before — which is a different
number on each side. It has to be *derived from something both sides already
agree on*, and in a component framework that thing is the shape of the tree.

So the id is a path. Each component gets a child context whose `id` is the
parent's plus its own position, and every `createUniqueId` inside it appends a
counter that is scoped to that component. The client walks the same tree in the
same order and recomputes the same path. Nothing is sent; the markup does not
carry the id for the framework's benefit.

That also explains the odd-looking letter in `a10`. It is a length prefix —
`String.fromCharCode(96 + digits - 1)` — and it exists because these strings
get concatenated as paths. Without it, parent `1` + child `10` and parent `11`
+ child `0` are the same string.

**The counter's real problem is not the restart, it is the sharing.** A
module-scope counter on the server is one variable for the whole process, so
two requests in flight interleave and neither matches a client that starts from
zero. The failure is per-request and load-dependent, which is the worst
possible shape for a bug — invisible in development, and appearing under
traffic as labels that point at the wrong control.

## Gotchas

**Calling it outside a render is asymmetric, and the loud half is the server.**
No hydration context means a thrown error during SSR and a cheerful `cl-0` on
the client. A helper that mints an id at module scope, or in a server function,
fails in exactly one of the two places.

**The ids are not opaque and not stable across a refactor.** They encode tree
position, so wrapping a subtree in a new component changes every id beneath it.
Never persist one, never put one in a URL, never assert on its literal value in
a test — match a shape, or read the id off the element.

**Order of calls inside a component matters, position of the component does
too.** Anything that makes the client's traversal differ from the server's —
a conditional that evaluates differently, a component rendered only on one side
— desynchronises the ids from that point on. The symptom is a label that stops
matching its control, not an error.

**A test that renders client-only exercises the other branch entirely.** Ids
seen under the test runner are `cl-N` from the counter; they say nothing about
the hydration path. This is why the assertion here had gone unchecked — the
whole suite runs on the branch that cannot show the problem.

## The limit of this verification

What was executed: the derivation in both builds, against the same context, and
the seeding that `hydrate` performs. What was **not** executed: a real SSR
render followed by a real hydration of the same tree. That path needs a browser
this environment does not have — an attempt to hydrate a live page under a
simulated DOM never ran the module script at all, and reported "identical" for
a document that had simply not changed.

So the remaining assumption is that hydration traverses the tree in the same
order as the server render. That is the hydration contract itself rather than
an extra thing to trust — if it did not hold, the DOM would already be
mismatched before any id was involved.

## Used in

`src/components/forms/field/field.tsx`, which mints the id that ties its label,
its control and its description together.

## Related

- [[a-render-prop-given-values-replaces-what-it-rendered]]
- [[an-ark-root-id-is-a-seed-not-the-controls-id]]
- [[a-check-that-cannot-fail-is-not-a-check]]
