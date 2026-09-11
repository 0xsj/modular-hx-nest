import { createLatestRead } from "~/lib/runtime/latest-read";
import { createStore } from "~/lib/runtime";
import type { Result } from "~/lib/kernel";
import type { Item } from "~/lib/services/example";

type RaceSource = {
  read: (
    selection: "earlier" | "newer",
    signal: AbortSignal,
  ) => Promise<Result<Item[]>>;
  release: () => void;
  dispose: () => void;
};

export function createRaceModel(createSource: () => RaceSource) {
  const phase = createStore<"idle" | "running" | "waiting" | "complete">(
    "idle",
  );
  const reader = createLatestRead(
    (input: { source: RaceSource; selection: "earlier" | "newer" }, signal) =>
      input.source.read(input.selection, signal),
  );
  let source: RaceSource | undefined;
  let earlier: Promise<void> | undefined;
  let generation = 0;
  function cancel() {
    generation++;
    reader.cancel();
    source?.dispose();
    phase.set("idle");
  }
  return {
    reader,
    phase,
    cancel,
    async start() {
      cancel();
      const own = generation;
      source = createSource();
      phase.set("running");
      earlier = reader.run({ source, selection: "earlier" });
      await reader.run({ source, selection: "newer" });
      if (own === generation) phase.set("waiting");
    },
    async release() {
      if (phase.get() !== "waiting") return;
      const own = generation;
      source?.release();
      await earlier;
      if (own === generation) phase.set("complete");
    },
  };
}
