import { For } from "solid-js";
import { DENSITIES, THEMES, hydrateRuntime, useDensity, useTheme } from "~/lib/runtime";
import s from "./theme-switch.module.css";

/* Was local to this route because `lib/runtime` did not exist. It does now, so
 * the state lives there and this is only the control — which also means the
 * preference persists and the page no longer owns a second copy of it. */

export function ThemeSwitch() {
  hydrateRuntime();
  const theme = useTheme();
  const density = useDensity();

  return (
    <div class={s.row}>
      <div class={s.group} role="group" aria-label="Theme">
        <For each={THEMES}>
          {(t) => (
            <button
              type="button"
              class={s.option}
              aria-pressed={theme.choice() === t}
              onClick={() => theme.set(t)}
            >
              {t}
            </button>
          )}
        </For>
      </div>

      <div class={s.group} role="group" aria-label="Density">
        <For each={DENSITIES}>
          {(d) => (
            <button
              type="button"
              class={s.option}
              aria-pressed={density.value() === d}
              onClick={() => density.set(d)}
            >
              {d}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
