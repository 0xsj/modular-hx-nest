import { asFailure, err, type Failure, type Result } from "../kernel";
import { createStore } from "./store";
import { localReturnTo } from "../url-state/local-return";
export { localReturnTo } from "../url-state/local-return";

export type SessionIdentity = { accountId: string };
export type SessionRecoveryState =
  | { state: "active" }
  | { state: "expired"; failure?: Failure }
  | { state: "checking" }
  | { state: "wrong-account" };

export function createSessionRecovery(
  accountId: string,
  returnTo: string,
  verify: (signal: AbortSignal) => Promise<Result<SessionIdentity>>,
) {
  const store = createStore<SessionRecoveryState>({ state: "active" });
  let generation = 0,
    controller: AbortController | undefined;
  function expire() {
    generation++;
    controller?.abort();
    store.set({ state: "expired" });
  }
  return {
    get: store.get,
    server: store.server,
    subscribe: store.subscribe,
    returnTo: localReturnTo(returnTo),
    accountId,
    canContinue: () => store.get().state === "active",
    expire,
    observe(failure: Failure) {
      if (failure.kind === "unauthenticated") expire();
    },
    async recover(): Promise<boolean> {
      if (store.get().state === "checking") return false;
      const own = ++generation;
      controller = new AbortController();
      store.set({ state: "checking" });
      let result: Result<SessionIdentity>;
      try {
        result = await verify(controller.signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== generation) return false;
      if (!result.ok) {
        store.set({ state: "expired", failure: result.error });
        return false;
      }
      if (result.value.accountId !== accountId) {
        store.set({ state: "wrong-account" });
        return false;
      }
      store.set({ state: "active" });
      return true;
    },
    dispose() {
      generation++;
      controller?.abort();
      if (store.get().state === "checking") store.set({ state: "expired" });
    },
  };
}
