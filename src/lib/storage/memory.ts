import { ok } from "../kernel";
import type { StoragePort } from "./port";

export function createMemoryStorage(): StoragePort {
  const values = new Map<string, string>();
  const listeners = new Map<string, Set<() => void>>();
  const notify = (key: string) => {
    for (const listener of listeners.get(key) ?? []) listener();
  };
  return {
    read: (key) => ok(values.get(key) ?? null),
    write(key, value) {
      values.set(key, value);
      notify(key);
      return ok(undefined);
    },
    remove(key) {
      values.delete(key);
      notify(key);
      return ok(undefined);
    },
    subscribe(key, listener) {
      const group = listeners.get(key) ?? new Set<() => void>();
      listeners.set(key, group);
      group.add(listener);
      return ok(() => {
        group.delete(listener);
      });
    },
  };
}
