import { asFailure, err, internal, type Failure, type Result } from "../kernel";
import {
  capability,
  type Capabilities,
  type Capability,
} from "../services/access";
import { createStore } from "./store";

type State =
  | { state: "unknown" | "loading" }
  | { state: "ready"; value: Capabilities }
  | { state: "failed"; failure: Failure };
export function createCapabilities(
  subject: string,
  resource: string,
  read: (signal: AbortSignal) => Promise<Result<Capabilities>>,
) {
  const store = createStore<State>({ state: "unknown" });
  let generation = 0,
    revision = 0,
    controller: AbortController | undefined;
  function invalidate() {
    generation++;
    controller?.abort();
    store.set({ state: "unknown" });
  }
  return {
    get: store.get,
    server: store.server,
    subscribe: store.subscribe,
    invalidate,
    decide(name: string): Capability {
      const state = store.get();
      return state.state === "ready"
        ? capability(state.value, name)
        : {
            allowed: false,
            reason:
              "Access has not been verified. Refresh permissions to continue.",
          };
    },
    async refresh() {
      controller?.abort();
      controller = new AbortController();
      const own = ++generation;
      store.set({ state: "loading" });
      let result: Result<Capabilities>;
      try {
        result = await read(controller.signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== generation) return;
      if (
        result.ok &&
        (result.value.subject !== subject ||
          result.value.resource !== resource ||
          result.value.revision < revision)
      )
        result = err(
          internal(
            "The permission snapshot is obsolete or belongs to another scope.",
            {
              type: "invalid_response",
            },
          ),
        );
      if (result.ok) {
        revision = result.value.revision;
        store.set({ state: "ready", value: result.value });
      } else store.set({ state: "failed", failure: result.error });
    },
    dispose: invalidate,
  };
}
