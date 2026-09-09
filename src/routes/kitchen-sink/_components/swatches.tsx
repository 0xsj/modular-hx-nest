import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import s from "./swatches.module.css";

/* The resolved value is the point of this page.
 *
 * A chip alone answers "is it green". It does not answer whether the semantic
 * indirection arrived — `--surface-panel` painting *something* proves nothing,
 * because an undefined custom property paints the parent's background and looks
 * deliberate. Reading the computed value back is the difference between looking
 * at the render and measuring it, and an empty string here means the token does
 * not exist, which is the failure worth seeing. */

export type SwatchKind = "color" | "shadow";
export type Ramp = { name: string; kind?: SwatchKind; tokens: string[] };

/** Resolved values, kept current through BOTH ways the answer can change.
 *
 *  `data-theme` and `data-density` are attributes, so a MutationObserver sees
 *  them. `prefers-color-scheme` changes nothing in the DOM at all — so without
 *  its own listener the `system` choice silently goes stale and the page shows
 *  the values from whichever scheme was active when it loaded. */
function resolved(tokens: () => string[]) {
  const [values, setValues] = createSignal<Record<string, string>>({});

  createEffect(() => {
    const names = tokens();
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      setValues(Object.fromEntries(names.map((t) => [t, style.getPropertyValue(t).trim()])));
    };
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-density"],
    });
    const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", read);

    onCleanup(() => {
      observer.disconnect();
      media?.removeEventListener("change", read);
    });
  });

  return values;
}

export function Swatches(props: { ramps: Ramp[] }) {
  /* Depend on the joined NAMES, not the array. A caller builds this with
     `flatMap`, so it is a fresh array every time and a fresh array never
     compares equal — the effect would re-run forever. */
  const names = () => props.ramps.flatMap((r) => r.tokens);
  const values = resolved(() => names().join(",").split(",").filter(Boolean));

  return (
    <For each={props.ramps}>
      {(ramp) => (
        <div class={s.ramp}>
          <Show when={ramp.name}>
            <div class={s.rampName}>{ramp.name}</div>
          </Show>
          <div class={s.grid}>
            <For each={ramp.tokens}>
              {(token) => {
                const value = () => values()[token];
                const missing = () => value() === "";
                return (
                  <div class={s.cell}>
                    <Show
                      when={ramp.kind === "shadow"}
                      fallback={
                        <div class={s.chip}>
                          <div class={s.paint} style={{ background: `var(${token})` }} />
                        </div>
                      }
                    >
                      <div class={s.shadowChip} style={{ "box-shadow": `var(${token})` }} />
                    </Show>
                    <div class={s.meta}>
                      <span class={s.token}>{token}</span>
                      <span class={missing() ? s.unresolved : s.value}>
                        {value() === undefined ? "…" : missing() ? "UNRESOLVED" : value()}
                      </span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      )}
    </For>
  );
}
