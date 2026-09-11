import { createMemo, For, mergeProps } from "solid-js";
import { seriesVariants, type SeriesVariants } from "../chart.variants";
import s from "../charts.module.css";
export type BarDatum = {
  label: string;
  value: number | null;
};
export type BarChartProps = Pick<SeriesVariants, "tone"> & {
  label: string;
  data: readonly BarDatum[];
  formatValue?: (value: number) => string;
};
const format = (value: number) => String(value);
const valid = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && value >= 0;
export function BarChart(incomingProps: BarChartProps) {
  const props = mergeProps(
    {
      formatValue: format,
    } as const,
    incomingProps,
  );
  const maximum = createMemo(() =>
    props.data.reduce(
      (max, item) => (valid(item.value) ? Math.max(max, item.value) : max),
      0,
    ),
  );
  return (
    <section aria-label={props.label} class={s.bars}>
      {props.data.length === 0 ? (
        <p class={s.empty}>No measurements to display.</p>
      ) : (
        <ul class={s.barList}>
          {
            <For each={props.data}>
              {(item) => (
                <li class={s.barRow}>
                  <span class={s.barLabel}>{item.label}</span>
                  <span class={s.barTrack} aria-hidden="true">
                    <span
                      class={seriesVariants({
                        tone: props.tone,
                      })}
                      style={{
                        width: `${(() => {
                          const _maximumSnapshot = maximum();
                          return valid(item.value) && _maximumSnapshot > 0
                            ? (item.value / _maximumSnapshot) * 100
                            : 0;
                        })()}%`,
                      }}
                    />
                  </span>
                  <span class={s.barValue}>
                    {valid(item.value)
                      ? props.formatValue(item.value)
                      : "Unavailable"}
                  </span>
                </li>
              )}
            </For>
          }
        </ul>
      )}
    </section>
  );
}
