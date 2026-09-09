import { For } from "solid-js";
import { SECTIONS } from "./_sections/registry";

/* The page composes; the shell is the layout beside this directory. The
 * registry is the one list both read, so a section cannot exist and be
 * unreachable. */
export default function KitchenSinkPage() {
  return <For each={SECTIONS}>{(entry) => <entry.Section />}</For>;
}
