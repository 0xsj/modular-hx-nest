/** The smallest store that satisfies a framework's subscription contract.
 *
 *  Framework-free on purpose: every sibling binds to it differently, and the
 *  binding is three lines each. What is worth sharing is the state machine and
 *  the persistence, not the hook.
 *
 *  `getSnapshot` must return a STABLE value between changes. A store returning
 *  a fresh object each call is a render loop, which is the failure this shape
 *  is otherwise prone to. */
export type Store<T> = {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  /** What the server sees. No DOM, no storage — the same value on every render
   *  of every request, or hydration mismatches. */
  server: () => T;
};

export function createStore<T>(
  initial: T,
  onChange?: (value: T) => void,
): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return; // no notification without a change
      value = next;
      onChange?.(value);
      for (const l of listeners) l();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    server: () => initial,
  };
}

/** Persist to local storage, tolerating every way it can fail.
 *
 *  It throws outright in some privacy modes, returns null in a fresh profile,
 *  and is absent on the server. A preference is not worth an exception, so
 *  every path here degrades to the default. */
export function persisted<T extends string>(
  key: string,
  fallback: T,
  valid: readonly T[],
): { read: () => T; write: (value: T) => void } {
  return {
    read: () => {
      try {
        const raw = globalThis.localStorage?.getItem(key);
        return valid.includes(raw as T) ? (raw as T) : fallback;
      } catch {
        return fallback;
      }
    },
    write: (value) => {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* a preference is not worth an exception */
      }
    },
  };
}
