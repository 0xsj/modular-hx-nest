import type { Failure, Result } from "../kernel";
import type { Stored, StoredDocument } from "../storage";
import { createStore } from "./store";

export type DocumentSnapshot<T> =
  | { state: "loading" }
  | { state: "ready"; result: Result<Stored<T>>; watchFailure?: Failure };

/** Stable snapshots for external-store bindings; connect after mount. */
export function createDocumentStore<T>(document: StoredDocument<T>) {
  const store = createStore<DocumentSnapshot<T>>({ state: "loading" });
  return {
    ...store,
    connect() {
      let watchFailure: Failure | undefined;
      const refresh = () =>
        store.set({ state: "ready", result: document.read(), watchFailure });
      const subscription = document.subscribe(refresh);
      if (!subscription.ok) watchFailure = subscription.error;
      refresh();
      return subscription.ok ? subscription.value : () => {};
    },
  };
}
