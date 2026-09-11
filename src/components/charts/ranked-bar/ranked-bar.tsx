import { createMemo, For, mergeProps } from "solid-js";
import { TBody, Td, Th, THead, Tr } from "~/components/display/table";
import { band, linear, px } from "../_kernel/scale";
import { ChartData } from "../_shared/chart-data";
import s from "../marks.module.css";
import { PlotFrame } from "../plot-frame";
export type Bar = {
  id: string;
  label: string;
  value: number;
};
export function RankedBar(incomingProps: {
  bars: readonly Bar[];
  width?: number;
  height?: number;
  yLabel?: string;
  title?: string;
}) {
  const props = mergeProps(
    {
      width: 460,
      height: 280,
      title: "Ranked bars",
    } as const,
    incomingProps,
  );
  // Sorted here rather than expecting a sorted input: the ORDER is the finding,
  // so it is the chart's job and not the caller's.
  const _titleSlot = createMemo(() => props.title);
  const sorted = createMemo(() =>
    props.bars
      .filter((bar) => Number.isFinite(bar.value) && bar.value >= 0)
      .sort((a, b) => b.value - a.value),
  );
  const m = {
    top: 14,
    right: 14,
    bottom: 52,
    left: 44,
  };
  const w = createMemo(() => props.width - m.left - m.right);
  const h = createMemo(() => props.height - m.top - m.bottom);
  const x = createMemo(() =>
    band(
      sorted().map((b) => b.id),
      [0, w()],
      0.28,
    ),
  );
  // Bars are ALWAYS measured from zero. A truncated bar axis exaggerates a
  // difference by however much was cut off, and the reader cannot see it.
  const y = createMemo(() =>
    linear([0, Math.max(...sorted().map((b) => b.value), 1)], [h(), 0]),
  );
  return (
    <>
      {(() => {
        const _sortedSnapshot = sorted();
        return _sortedSnapshot.length ? (
          <PlotFrame
            width={props.width}
            height={props.height}
            margin={m}
            y={y()}
            yLabel={props.yLabel}
            title={_titleSlot()}
            grid
          >
            <For each={_sortedSnapshot}>
              {(b) => (
                <g>
                  <rect
                    class={s.bar}
                    x={px(x()(b.id))}
                    y={px(y()(b.value))}
                    width={px(x().bandWidth)}
                    height={px(h() - y()(b.value))}
                    rx={3}
                  >
                    <title>{`${b.label} · ${b.value}`}</title>
                  </rect>
                  {/* Direct labels, because ten bars with an axis is ten lookups. */}
                  <text
                    class={s.barValue}
                    x={px(x()(b.id) + x().bandWidth / 2)}
                    y={px(y()(b.value) - 5)}
                    text-anchor="middle"
                  >
                    {b.value}
                  </text>
                  <text
                    class={s.barLabel}
                    transform={`translate(${px(x()(b.id) + x().bandWidth / 2)} ${px(h() + 12)}) rotate(-38)`}
                    text-anchor="end"
                  >
                    {b.label}
                  </text>
                </g>
              )}
            </For>
          </PlotFrame>
        ) : (
          <p class={s.message}>
            {props.bars.length
              ? "Measurements unavailable."
              : "No measurements to display."}
          </p>
        );
      })()}
      <ChartData title={_titleSlot()}>
        <THead>
          <Tr>
            <Th>Item</Th>
            <Th numeric>{props.yLabel ?? "Value"}</Th>
          </Tr>
        </THead>
        <TBody>
          <For
            each={[
              ...sorted(),
              ...props.bars.filter(
                (bar) => !Number.isFinite(bar.value) || bar.value < 0,
              ),
            ]}
          >
            {(bar) => (
              <Tr>
                <Th scope="row">{bar.label}</Th>
                <Td numeric>
                  {Number.isFinite(bar.value) && bar.value >= 0
                    ? String(bar.value)
                    : "Unavailable"}
                </Td>
              </Tr>
            )}
          </For>
        </TBody>
      </ChartData>
    </>
  );
}
