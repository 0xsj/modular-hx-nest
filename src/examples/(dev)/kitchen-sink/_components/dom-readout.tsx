import type { JSX } from "solid-js";
import { createSignal, onCleanup, onMount } from "solid-js";
import s from "./sink.module.css";

/* Three of the four utility components do their work in the accessibility tree,
 * where there is nothing for a gallery to show.
 *
 * So show the DOM they produce, read back from the live element rather than
 * transcribed beside it — the same argument the palette makes about computed
 * token values. A transcribed snippet is a second copy that goes stale silently,
 * and here it would be a claim about hiding that nothing checked. */
export function DomReadout(props: { note?: string; children: JSX.Element }) {
  const ref: {
    current: HTMLDivElement | null;
  } = {
    current: null,
  };
  const [markup, setMarkup] = createSignal("");
  const [text, setText] = createSignal("");

  /* Empty deps deliberately: these demos are static, and `children` is a fresh
     value on every render, so depending on it would re-run this every time. */
  onMount(() => {
    const cleanup = (() => {
      const el = ref.current;
      if (!el) return;
      setMarkup(el.innerHTML.replace(/></g, ">\n<"));
      setText((el.textContent ?? "").replace(/\s+/g, " ").trim());
    })();
    if (typeof cleanup === "function") onCleanup(cleanup);
  });
  return (
    <div class={s.readout}>
      <div ref={(element) => (ref.current = element)} class={s.readoutStage}>
        {props.children}
      </div>
      <div class={s.readoutRow}>
        <span class={s.rowLabel}>reads as</span>
        <span class={s.readoutText}>{markup() ? `“${text()}”` : "…"}</span>
      </div>
      {props.note ? <p class={s.limits}>{props.note}</p> : null}
      <pre class={s.codeBlock}>
        <code>{markup() || "…"}</code>
      </pre>
    </div>
  );
}
