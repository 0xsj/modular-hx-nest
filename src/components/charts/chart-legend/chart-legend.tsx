import { For, mergeProps } from "solid-js";
import { seriesVariants, type SeriesVariants } from "../chart.variants";
import s from "../charts.module.css";
export type ChartSeries = SeriesVariants & {
  key: string;
  label: string;
};
export type ChartLegendProps = {
  series: readonly ChartSeries[];
  label?: string;
};
export function ChartLegend(incomingProps: ChartLegendProps) {
  const props = mergeProps(
    {
      label: "Chart legend",
    } as const,
    incomingProps,
  );
  return (
    <ul aria-label={props.label} class={s.legend}>
      <For each={props.series}>
        {(item) => (
          <li class={seriesVariants(item)}>
            <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="24" y2="5" class={s.stroke} />
            </svg>
            <span class={s.legendLabel}>{item.label}</span>
          </li>
        )}
      </For>
    </ul>
  );
}
