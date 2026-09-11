import type { Accessor } from "solid-js";
/** Browser-owned queries keep the SSR shell renderable without subscribing its
 * Suspense boundary to TanStack's resource. Data becomes observable after mount;
 * reads still go through the query cache and its native Solid subscription. */
export function clientData<T extends object>(
  result: T,
  ready: Accessor<boolean>,
): T {
  return new Proxy(result, {
    get(target, property) {
      if (property === "data" && !ready()) return undefined;
      return Reflect.get(target, property);
    },
  });
}
