import {
  asFailure,
  canceled,
  err,
  internal,
  ok,
  type Failure,
  type Result,
} from "../kernel";
import { createStore } from "./store";

export type DraftAttempt<D> = { operationId: string; draft: D };
export type DraftPhase<A> =
  | { state: "ready" | "not-recorded" }
  | { state: "refused"; failure: Failure; submitted: A }
  | { state: "saving" | "checking"; attempt: A }
  | { state: "unknown"; attempt: A; failure: Failure };
export type DraftState<D, A, R> = {
  draft: D;
  baseline: D;
  confirmed: R | null;
  phase: DraftPhase<A>;
  checkpointFailure?: Failure;
};
export type DraftCheckpoint<D, A, R> = {
  draft: D;
  baseline: D;
  confirmed: R | null;
  attempt: A | null;
};
export type DraftPort<A, R> = {
  save(attempt: A, signal: AbortSignal): Promise<Result<R>>;
  find(operationId: string, signal: AbortSignal): Promise<Result<R | null>>;
};

export function createSaveDraft<
  D,
  A extends DraftAttempt<D>,
  R extends DraftAttempt<D>,
>(
  port: DraftPort<A, R>,
  initial: D,
  options: {
    same(a: D, b: D): boolean;
    attempt(draft: D, operationId: string, confirmed: R | null): A;
    matches?(attempt: A, receipt: R): boolean;
    refused?(failure: Failure): boolean;
    newId?: () => string;
    restored?: DraftCheckpoint<D, A, R>;
    persist?(state: DraftState<D, A, R>): Result<void>;
  },
) {
  const restored = options.restored;
  const store = createStore<DraftState<D, A, R>>({
    draft: structuredClone(restored?.draft ?? initial),
    baseline: structuredClone(restored?.baseline ?? initial),
    confirmed: restored?.confirmed ?? null,
    phase: restored?.attempt
      ? {
          state: "unknown",
          attempt: restored.attempt,
          failure: canceled(
            "The earlier save was interrupted. Check its outcome before saving again.",
          ),
        }
      : { state: "ready" },
  });
  let generation = 0;
  let controller: AbortController | undefined;
  function transition(state: DraftState<D, A, R>): Result<void> {
    let persisted: Result<void>;
    try {
      persisted = options.persist?.(state) ?? ok(undefined);
    } catch {
      persisted = err(internal("The draft checkpoint could not be saved."));
    }
    store.set({
      ...state,
      checkpointFailure: persisted.ok ? undefined : persisted.error,
    });
    return persisted;
  }
  const updatePhase = (phase: DraftPhase<A>) =>
    transition({ ...store.get(), phase });
  const uncertain = (attempt: A, failure: Failure) =>
    updatePhase({ state: "unknown", attempt, failure });
  function confirm(attempt: A, receipt: R) {
    if (
      receipt.operationId !== attempt.operationId ||
      !options.same(receipt.draft, attempt.draft) ||
      (options.matches && !options.matches(attempt, receipt))
    ) {
      uncertain(
        attempt,
        internal("The receipt did not match this save.", {
          type: "invalid_response",
        }),
      );
      return;
    }
    // Receipt ownership is about the captured input, never the current editor.
    transition({
      ...store.get(),
      baseline: structuredClone(receipt.draft),
      confirmed: receipt,
      phase: { state: "ready" },
    });
  }
  return {
    get: store.get,
    server: store.server,
    subscribe: store.subscribe,
    edit(draft: D) {
      const current = store.get();
      transition({ ...current, draft: structuredClone(draft) });
    },
    checkpoint() {
      return transition(store.get());
    },
    discard() {
      if (["saving", "checking", "unknown"].includes(store.get().phase.state))
        return false;
      transition({
        ...store.get(),
        draft: structuredClone(store.get().baseline),
        phase: { state: "ready" },
      });
      return true;
    },
    async save() {
      const current = store.get();
      if (["saving", "checking", "unknown"].includes(current.phase.state))
        return;
      const attempt = options.attempt(
        structuredClone(current.draft),
        (options.newId ?? (() => crypto.randomUUID()))(),
        current.confirmed,
      );
      const own = ++generation;
      controller = new AbortController();
      const checkpoint = updatePhase({ state: "saving", attempt });
      if (!checkpoint.ok) {
        updatePhase({
          state: "refused",
          failure: checkpoint.error,
          submitted: attempt,
        });
        return;
      }
      let result: Result<R>;
      try {
        result = await port.save(attempt, controller.signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== generation) return;
      if (result.ok) confirm(attempt, result.value);
      else if (
        (options.refused ?? ((failure) => failure.kind === "invalid"))(
          result.error,
        )
      )
        updatePhase({
          state: "refused",
          failure: result.error,
          submitted: attempt,
        });
      else uncertain(attempt, result.error);
    },
    async check() {
      const phase = store.get().phase;
      if (phase.state !== "unknown") return;
      const { attempt } = phase;
      const own = ++generation;
      controller = new AbortController();
      updatePhase({ state: "checking", attempt });
      let result: Result<R | null>;
      try {
        result = await port.find(attempt.operationId, controller.signal);
      } catch (cause) {
        result = err(asFailure(cause));
      }
      if (own !== generation) return;
      if (!result.ok) uncertain(attempt, result.error);
      else if (result.value === null) updatePhase({ state: "not-recorded" });
      else confirm(attempt, result.value);
    },
    cancel() {
      generation++;
      controller?.abort();
      const phase = store.get().phase;
      if (phase.state === "saving" || phase.state === "checking")
        uncertain(
          phase.attempt,
          canceled(
            "The operation was interrupted. Check its outcome before saving again.",
          ),
        );
    },
  };
}
