import {
  err,
  forbidden,
  internal,
  ok,
  conflict,
  unavailable,
  type Failure,
  type Result,
} from "../kernel";
import type { StoragePort } from "./port";

// Separate adapters in the same document still hear one another. No browser
// object is touched until an operation is called after hydration.
const listeners = new WeakMap<Storage, Set<(key: string) => void>>();

function failure(error: unknown): Failure {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? error.name
      : "";
  if (name === "SecurityError")
    return forbidden("Browser storage is blocked.", {
      type: "storage_blocked",
    });
  if (name === "QuotaExceededError")
    return conflict("Browser storage is full. The change was not saved.", {
      type: "storage_quota",
    });
  return internal("Browser storage could not complete this operation.", {
    type: "storage_operation",
  });
}

/** Local persists across browser sessions; session is isolated to a tab and
 * survives its reloads. Neither area is touched during construction. */
export function createBrowserStorage(
  area: "local" | "session" = "local",
): StoragePort {
  function access<T>(operation: (storage: Storage) => T): Result<T> {
    try {
      if (typeof window === "undefined") {
        return err(
          unavailable("Browser storage is not available.", {
            type: "storage_unavailable",
          }),
        );
      }
      const storage =
        area === "session" ? window.sessionStorage : window.localStorage;
      return ok(operation(storage));
    } catch (error) {
      return err(failure(error));
    }
  }
  function change(
    key: string,
    operation: (storage: Storage) => void,
  ): Result<void> {
    const result = access((storage) => {
      operation(storage);
      return storage;
    });
    if (!result.ok) return err(result.error);
    // Notify outside the browser-operation catch: a subscriber's bug must not
    // falsely claim the successfully committed write failed.
    for (const listener of listeners.get(result.value) ?? []) listener(key);
    return ok(undefined);
  }
  return {
    read: (key) => access((storage) => storage.getItem(key)),
    write: (key, value) =>
      change(key, (storage) => storage.setItem(key, value)),
    remove: (key) => change(key, (storage) => storage.removeItem(key)),
    subscribe(key, listener) {
      return access((storage) => {
        const local = (changed: string) => {
          if (changed === key) listener();
        };
        const remote = (event: StorageEvent) => {
          if (
            event.storageArea === storage &&
            (event.key === key || event.key === null)
          )
            listener();
        };
        const group =
          listeners.get(storage) ?? new Set<(key: string) => void>();
        listeners.set(storage, group);
        group.add(local);
        window.addEventListener("storage", remote);
        return () => {
          group.delete(local);
          window.removeEventListener("storage", remote);
        };
      });
    },
  };
}
