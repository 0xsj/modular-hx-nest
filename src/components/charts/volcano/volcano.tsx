import { createMemo, For, mergeProps } from "solid-js";
import { TBody, Td, Th, THead, Tr } from "~/components/display/table";
import { extentOf, linear, pad, px } from "../_kernel/scale";
import { ChartData } from "../_shared/chart-data";
import s from "../marks.module.css";
import { PlotFrame } from "../plot-frame";
export type VolcanoPoint = {
  id: string;
  /** Effect size. */
  x: number;
  /** Significance, already negated-log'd by the caller — this chart does not
   *  transform data. A chart that silently logs its input is a chart whose axis
   *  label is the only place the transform is recorded. */
  y: number;
  label?: string;
};
export function Volcano(incomingProps: {
  points: readonly VolcanoPoint[];
  width?: number;
  height?: number;
  effectCut?: number;
  significanceCut?: number;
  xLabel?: string;
  yLabel?: string;
  /** Ids to write a name beside. Selective by design — a label on every point
   *  is a wall of text, and the ones worth naming are a judgement the caller
   *  makes, not a threshold. */
  labelled?: readonly string[];
  title?: string;
}) {
  const props = mergeProps(
    {
      width: 460,
      height: 320,
      effectCut: 1,
      significanceCut: 1.3,
      xLabel: "log₂ fold change",
      yLabel: "−log₁₀ adjusted p",
      title: "Volcano plot",
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const points = createMemo(() =>
    props.points.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ),
  );
  const m = {
    top: 14,
    right: 18,
    bottom: 38,
    left: 48,
  };
  const w = createMemo(() => props.width - m.left - m.right);
  const h = createMemo(() => props.height - m.top - m.bottom);
  const x = createMemo(() =>
    linear(pad(extentOf(points().map((p) => p.x))), [0, w()]),
  );
  const y = createMemo(() =>
    linear(
      pad([0, Math.max(...points().map((p) => p.y), props.significanceCut)]),
      [h(), 0],
    ),
  );
  const named = createMemo(() => new Set(props.labelled ?? []));
  return (
    <>
      {(() => {
        const _pointsSnapshot = points();
        return _pointsSnapshot.length ? (
          <PlotFrame
            width={props.width}
            height={props.height}
            margin={m}
            x={x()}
            y={y()}
            xLabel={props.xLabel}
            yLabel={props.yLabel}
            title={_titleSlot()}
            rules={[
              {
                y: props.significanceCut,
              },
              {
                x: props.effectCut,
              },
              {
                x: -props.effectCut,
              },
            ]}
          >
            <For each={_pointsSnapshot}>
              {(p) => {
                // Three states, and "not significant" is one of them rather than an
                // absence. A grey point is a measured result.
                const state =
                  p.y < props.significanceCut
                    ? "quiet"
                    : p.x >= props.effectCut
                      ? "up"
                      : p.x <= -props.effectCut
                        ? "down"
                        : "quiet";
                return (
                  <circle
                    class={s.point}
                    data-state={state}
                    cx={px(x()(p.x))}
                    cy={px(y()(p.y))}
                    r={state === "quiet" ? 2 : 2.9}
                  >
                    <title>{`${p.label ?? p.id} · ${p.x.toFixed(2)} · ${p.y.toFixed(2)}`}</title>
                  </circle>
                );
              }}
            </For>

            <For each={_pointsSnapshot.filter((p) => named().has(p.id))}>
              {(p) => (
                <text
                  class={s.pointLabel}
                  x={px(x()(p.x) + 5)}
                  y={px(y()(p.y) + 3)}
                >
                  {p.label ?? p.id}
                </text>
              )}
            </For>
          </PlotFrame>
        ) : (
          <p class={s.message}>
            {props.points.length
              ? "Measurements unavailable."
              : "No measurements to display."}
          </p>
        );
      })()}
      <ChartData title={_titleSlot()}>
        <THead>
          <Tr>
            <Th>Point</Th>
            <Th numeric>{props.xLabel}</Th>
            <Th numeric>{props.yLabel}</Th>
            <Th>Threshold</Th>
          </Tr>
        </THead>
        <TBody>
          <For each={props.points}>
            {(point) => (
              <Tr>
                <Th scope="row">{point.label ?? point.id}</Th>
                <Td numeric>
                  {Number.isFinite(point.x) ? String(point.x) : "Unavailable"}
                </Td>
                <Td numeric>
                  {Number.isFinite(point.y) ? String(point.y) : "Unavailable"}
                </Td>
                <Td>
                  {!Number.isFinite(point.x) || !Number.isFinite(point.y)
                    ? "Unavailable"
                    : point.y >= props.significanceCut &&
                        Math.abs(point.x) >= props.effectCut
                      ? point.x >= 0
                        ? "Positive"
                        : "Negative"
                      : "Below threshold"}
                </Td>
              </Tr>
            )}
          </For>
        </TBody>
      </ChartData>
    </>
  );
}
