import { asFailure, err, type Failure, type Result } from "../kernel";
import { createStore } from "./store";

export type ReadState<T> =
  | { state: "idle" }
  | { state: "pending"; previous?: T }
  | { state: "ready"; value: T }
  | { state: "failed"; failure: Failure; previous?: T };

/** For an uncached, replaceable read. Cached resources use lib/query instead.
 * The last invocation owns the result even if a transport ignores abort.
 * Previous data is retained only inside this instance's identity/scope; create
 * another instance when that scope changes. Cancel restores the settled state.
 * The store is inert until run(), and cancel() leaves it reusable after cleanup.
 */
export function createLatestRead<Input, Value>(
  read: (input: Input, signal: AbortSignal) => Promise<Result<Value>>,
) {
  const store = createStore<ReadState<Value>>({ state: "idle" });
  let settled: ReadState<Value> = { state: "idle" };
  let previous: Value | undefined;
  let controller: AbortController | undefined;
  let generation = 0;

  return {
    ...store,
    async run(input: Input) {
      const own = ++generation;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      store.set({ state: "pending", previous });
      let result: Result<Value>;
      try {
        result = await read(input, signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== generation || signal.aborted) return;
      if (result.ok) {
        previous = result.value;
        settled = { state: "ready", value: result.value };
      } else {
        settled = { state: "failed", failure: result.error, previous };
      }
      store.set(settled);
    },
    cancel() {
      generation++;
      controller?.abort();
      store.set(settled);
    },
  };
}
