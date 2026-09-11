import { createEffect, createSignal, For, on, onCleanup } from "solid-js";
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
export type Ramp = {
  name: string;
  kind?: SwatchKind;
  tokens: string[];
};

/* The dependency is the joined names, not the array.
 *
 * A caller builds this list with `flatMap`, so it is a fresh array on every
 * render and a fresh array never compares equal — the effect re-runs, setState
 * re-renders, and the render builds another array. That is an infinite loop
 * whose symptom is "Maximum update depth exceeded" pointing at this line rather
 * than at the caller that actually allocates. A string of the names is stable
 * across renders and still changes when the set of tokens does. */
function useResolved(tokens: () => string[]) {
  const [values, setValues] = createSignal<Record<string, string>>({});
  const key = () => tokens().join(",");
  createEffect(
    on(key, (namesKey) => {
      const cleanup = (() => {
        const names = namesKey ? namesKey.split(",") : [];
        const read = () => {
          const style = getComputedStyle(document.documentElement);
          setValues(
            Object.fromEntries(
              names.map((t) => [t, style.getPropertyValue(t).trim()]),
            ),
          );
        };
        read();

        // `data-theme` is set by the switch; `prefers-color-scheme` changes nothing
        // in the DOM, so it needs its own listener or "system" silently goes stale.
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme", "data-density"],
        });
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", read);
        return () => {
          observer.disconnect();
          media.removeEventListener("change", read);
        };
      })();
      if (typeof cleanup === "function") onCleanup(cleanup);
    }),
  );
  return values;
}
export function Swatches(props: { ramps: Ramp[] }) {
  const values = useResolved(() => props.ramps.flatMap((r) => r.tokens));
  return (
    <>
      <For each={props.ramps}>
        {(ramp) => (
          <div class={s.ramp}>
            {ramp.name ? <div class={s.rampName}>{ramp.name}</div> : null}
            <div class={s.grid}>
              <For each={ramp.tokens}>
                {(token) => {
                  const value = () => values()[token];
                  const missing = () => value() === "";
                  return (
                    <div class={s.cell}>
                      {ramp.kind === "shadow" ? (
                        <div
                          class={s.shadowChip}
                          style={{
                            "box-shadow": `var(${token})`,
                          }}
                        />
                      ) : (
                        <div class={s.chip}>
                          <div
                            class={s.paint}
                            style={{
                              background: `var(${token})`,
                            }}
                          />
                        </div>
                      )}
                      <div class={s.meta}>
                        <span class={s.token}>{token}</span>
                        <span class={missing() ? s.unresolved : s.value}>
                          {value() === undefined
                            ? "…"
                            : missing()
                              ? "UNRESOLVED"
                              : value()}
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
    </>
  );
}
