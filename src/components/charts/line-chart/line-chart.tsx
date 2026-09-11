import { createMemo, For, mergeProps } from "solid-js";
import { Table, TBody, Td, Th, THead, Tr } from "~/components/display/table";
import type { ChartSeries } from "../chart-legend";
import { seriesVariants } from "../chart.variants";
import s from "../charts.module.css";
export type LineDatum = {
  label: string;
  values: Readonly<Record<string, number | null>>;
};
export type LineChartProps = {
  label: string;
  data: readonly LineDatum[];
  series: readonly ChartSeries[];
  formatValue?: (value: number) => string;
};
const format = (value: number) => String(value);
const tickFormat = (value: number) =>
  value.toLocaleString("en-US", {
    maximumSignificantDigits: 3,
    notation:
      Math.abs(value) >= 1000000 || (value !== 0 && Math.abs(value) < 0.01)
        ? "scientific"
        : "standard",
  });
const valid = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);
export function LineChart(incomingProps: LineChartProps) {
  const props = mergeProps(
    {
      formatValue: format,
    } as const,
    incomingProps,
  );
  const domain = createMemo(() => {
    let low = 0;
    let high = 0;
    let measured = false;
    for (const item of props.data)
      for (const entry of props.series) {
        const value = item.values[entry.key];
        if (valid(value)) {
          measured = true;
          low = Math.min(low, value);
          high = Math.max(high, value);
        }
      }
    if (low === high) high = 1;
    // Normalize before subtracting so even opposite finite extremes cannot
    // overflow the domain and turn the SVG coordinates into NaN.
    const scale = Math.max(Math.abs(low), Math.abs(high));
    return { low, high, measured, scale };
  });
  const x = (index: number) =>
    props.data.length === 1
      ? 322
      : 64 + (index / (props.data.length - 1)) * 516;
  const y = (value: number) =>
    18 +
    ((domain().high / domain().scale - value / domain().scale) /
      (domain().high / domain().scale - domain().low / domain().scale)) *
      172;
  const ticks = createMemo(() => [
    domain().high,
    domain().high / 2 + domain().low / 2,
    domain().low,
  ]);
  const labelEvery = createMemo(() =>
    Math.max(1, Math.ceil(props.data.length / 6)),
  );
  return (
    <>
      {!props.data.length || !props.series.length ? (
        <p class={s.empty}>No measurements to display.</p>
      ) : (
        <div class={s.lineChart}>
          {domain().measured ? (
            <div
              class={s.chartViewport}
              role="region"
              tabindex={0}
              aria-label={`${props.label} plot — scroll horizontally on small screens`}
            >
              <svg
                viewBox="0 0 608 230"
                class={s.svg}
                role="img"
                aria-label={`${props.label}. Exact values in the data table below.`}
              >
                {
                  <For each={ticks()}>
                    {(tick) => (
                      <g class={s.axis}>
                        <line
                          x1="64"
                          y1={y(tick)}
                          x2="580"
                          y2={y(tick)}
                          class={s.gridLine}
                        />
                        <text x="54" y={y(tick)} dy="0.35em" text-anchor="end">
                          {props.formatValue === format
                            ? tickFormat(tick)
                            : props.formatValue(tick)}
                        </text>
                      </g>
                    )}
                  </For>
                }
                {domain().low < 0 && domain().high > 0 && (
                  <line
                    x1="64"
                    y1={y(0)}
                    x2="580"
                    y2={y(0)}
                    class={s.zeroLine}
                  />
                )}
                {
                  <For each={props.data}>
                    {(item, index) => (
                      <>
                        {" "}
                        {index() % labelEvery() === 0 ||
                        index() === props.data.length - 1 ? (
                          <text
                            x={x(index())}
                            y="216"
                            text-anchor={
                              index() === 0
                                ? "start"
                                : index() === props.data.length - 1
                                  ? "end"
                                  : "middle"
                            }
                            class={s.axis}
                          >
                            {item.label}
                          </text>
                        ) : null}{" "}
                      </>
                    )}
                  </For>
                }
                <For each={props.series}>
                  {(entry) => {
                    const path = createMemo(() => {
                      let connected = false;
                      return props.data
                        .map((item, index) => {
                          const value = item.values[entry.key];
                          if (!valid(value)) {
                            connected = false;
                            return "";
                          }
                          const command = connected ? "L" : "M";
                          connected = true;
                          return `${command}${x(index)},${y(value)}`;
                        })
                        .join(" ");
                    });
                    return (
                      <g class={seriesVariants(entry)}>
                        <path d={path()} class={s.stroke} fill="none" />
                        {
                          <For each={props.data}>
                            {(item, index) => {
                              const value = item.values[entry.key];
                              return valid(value) ? (
                                <circle
                                  cx={x(index())}
                                  cy={y(value)}
                                  r="3"
                                  fill="currentColor"
                                >
                                  <title>{`${entry.label}, ${item.label}: ${props.formatValue(value)}`}</title>
                                </circle>
                              ) : null;
                            }}
                          </For>
                        }
                      </g>
                    );
                  }}
                </For>
              </svg>
            </div>
          ) : (
            <p class={s.empty}>Measurements unavailable.</p>
          )}
          <details class={s.data}>
            <summary>View data for {props.label}</summary>
            <Table caption={props.label}>
              <THead>
                <Tr>
                  <Th>Period</Th>
                  <For each={props.series}>
                    {(entry) => <Th numeric>{entry.label}</Th>}
                  </For>
                </Tr>
              </THead>
              <TBody>
                {
                  <For each={props.data}>
                    {(item) => (
                      <Tr>
                        <Th scope="row">{item.label}</Th>
                        <For each={props.series}>
                          {(entry) => {
                            const value = item.values[entry.key];
                            return (
                              <Td numeric>
                                {valid(value)
                                  ? props.formatValue(value)
                                  : "Unavailable"}
                              </Td>
                            );
                          }}
                        </For>
                      </Tr>
                    )}
                  </For>
                }
              </TBody>
            </Table>
          </details>
        </div>
      )}
    </>
  );
}
