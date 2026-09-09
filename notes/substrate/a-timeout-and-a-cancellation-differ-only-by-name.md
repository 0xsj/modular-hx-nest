# A timeout and a cancellation differ only by name

`instanceof DOMException` is true for both, so it is not the wrong check
because it is unreliable — it is the wrong check because it is *insufficient*,
and the only thing that separates a timeout worth retrying from a cancellation
that must never be retried is a string.

**True of Node 22.21.1's `fetch`, and of `happy-dom` 20.14.0 under `vitest`
5.0.0 · verified 2026-09-09 — measured, twice, in both environments.**

**Origin** — specifying a transport adapter, and needing to state how an abort
becomes a failure. The first draft asserted that `instanceof` was unreliable
under a test DOM. Measuring said the opposite, and then said something worse.

## What was measured

Against a server that accepts a connection and never answers:

```
  node fetch    controller.abort()                       AbortError
                AbortSignal.timeout(ms)                  TimeoutError
                AbortSignal.any([timeout, callerSignal]) TimeoutError
                instanceof DOMException                  true, all three

  happy-dom     controller.abort()                       NetworkError
                AbortSignal.timeout(ms)                  NetworkError
                instanceof DOMException                  true, both
```

Two separate findings, and the second is the one that costs an afternoon.

## 1 · Hand-rolling the timeout collapses the distinction

A timeout built by aborting a controller on a timer raises `AbortError` — the
same name the caller's own cancellation raises. Anything downstream that treats
a cancellation as *the caller asked for this, do not retry* will then refuse to
retry any timeout, permanently, while showing a correct-looking cancellation.

`AbortSignal.timeout` raises `TimeoutError` instead, and `AbortSignal.any`
preserves it when the timeout is what fired — so combining the caller's signal
with a timeout keeps both distinguishable. That combination is what a client
needs anyway: a caller passing a signal has not given up its right to a
timeout.

## 2 · The test environment can erase the property under test

A simulated DOM's `fetch` is its own implementation, and this one reports
`NetworkError` for both routes. So a test written there passes whether the
timeout is hand-rolled or not — **green, and measuring nothing.**

A stub does not rescue it either: a stubbed `fetch` resolves before any timeout
can fire, so the branch is never reached.

The only honest test runs against the runtime's own `fetch`, with a server that
accepts and never answers, in a file that opts out of the simulated DOM.

## Gotchas

**The obvious probe measures the wrong thing.** Pointing a timeout at a closed
port gives `NetworkError` in every environment, because the connection is
refused long before the timer fires. The target has to accept and then hang, or
the timeout never happens and the result is a fact about connection refusal.

**Distrust a claim about `instanceof` before repeating it.** The received
wisdom here is that a DOM global differs between the test environment and the
runtime, so `instanceof` fails. It did not fail in either environment measured.
Matching by name is still right, for a different reason.

**This is a property of the CONTRACT's verifiability, not of the test file.** A
clause whose only honest test needs a different environment will otherwise be
tested wrongly and pass, so the requirement belongs in the specification beside
the clause rather than as a comment somebody finds later.

## Used in

`src/lib/http/envelope.ts` — the name-to-kind mapping and its stated limit;
`src/lib/http/fetch-client.ts` — the timeout construction and signal
combination; clauses E14 and A5, and §7 of `src/lib/http/adapters.doc.ts`.

## Related

- [[a-check-that-cannot-fail-is-not-a-check]] — the green-and-measuring-nothing family
- [[read-a-computed-style-after-the-transition-settles]] — the instrument being wrong in the other direction
