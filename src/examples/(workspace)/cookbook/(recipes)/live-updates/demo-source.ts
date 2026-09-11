import { createMemorySource } from "~/lib/realtime";
import { err, ok, unavailable } from "~/lib/kernel";

export type DemoEvent = { type: "metrics.changed"; revision: number };
/** Per-mount simulated server. No socket or real backend is claimed here. */
export function createLiveDemo() {
  const source = createMemorySource<DemoEvent>();
  let revision = 0;
  let failing = false;
  let reads = 0;
  return {
    source,
    emit() {
      revision++;
      source.publish({ type: "metrics.changed", revision });
    },
    failReads(value: boolean) {
      failing = value;
    },
    async read() {
      reads++;
      return failing
        ? err(unavailable("The simulated data source is unavailable."))
        : ok({
            requests: 1240 + revision * 17,
            queued: Math.max(0, 12 - revision),
            revision,
            reads,
          });
    },
  };
}
