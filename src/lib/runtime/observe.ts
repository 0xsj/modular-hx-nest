import {
  createSignal,
  createEffect,
  untrack,
  onMount,
  onCleanup,
  type Accessor,
} from "solid-js";
/** Subscribe only after mounting. SSR and hydration start with the same stable
 * snapshot; a second read after subscription closes the lost-update window. */
export function observeStore<T>(
  subscribe: (listener: () => void) => () => void,
  get: () => T,
  server: () => T = get,
): Accessor<T> {
  const [value, setValue] = createSignal<T>(server());
  onMount(() => {
    const update = () => setValue(() => get());
    const stop = subscribe(update);
    update();
    onCleanup(stop);
  });
  return value;
}

export type ObservableSource<T> = {
  subscribe(listener: () => void): () => void;
  get(): T;
  server(): T;
};
/** Use when the caller can replace the source. Rebind on owner changes and
 * unsubscribe the previous model before reading the next one. */
export function observeSource<T>(
  source: Accessor<ObservableSource<T>>,
): Accessor<T> {
  const [value, setValue] = createSignal<T>(untrack(() => source().server()));
  onMount(() => {
    createEffect(() => {
      const current = source();
      const update = () => setValue(() => current.get());
      const stop = current.subscribe(update);
      update();
      onCleanup(stop);
    });
  });
  return value;
}
