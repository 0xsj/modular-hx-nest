import { createMemo, For, mergeProps } from "solid-js";
import { TBody, Td, Th, THead, Tr } from "~/components/display/table";
import { categorical, radiusFor } from "../_kernel/encode";
import { extentOf, linear, pad, px } from "../_kernel/scale";
import { ChartData } from "../_shared/chart-data";
import s from "../marks.module.css";
import { PlotFrame } from "../plot-frame";
export type Bubble = {
  id: string;
  x: number;
  y: number;
  /** Mapped to AREA, not radius. */
  weight: number;
  category?: string;
  label?: string;
};
export function BubblePlot(incomingProps: {
  bubbles: readonly Bubble[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  /** Fixed order. Assigning hue by first-seen would repaint the survivors when
   *  a filter changes what is present. */
  categories?: readonly string[];
  title?: string;
}) {
  const props = mergeProps(
    {
      width: 460,
      height: 320,
      title: "Bubble plot",
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const bubbles = createMemo(() =>
    props.bubbles.filter(
      (bubble) =>
        Number.isFinite(bubble.x) &&
        Number.isFinite(bubble.y) &&
        Number.isFinite(bubble.weight) &&
        bubble.weight >= 0,
    ),
  );
  const m = {
    top: 14,
    right: 22,
    bottom: 38,
    left: 48,
  };
  const w = createMemo(() => props.width - m.left - m.right);
  const h = createMemo(() => props.height - m.top - m.bottom);
  const x = createMemo(() =>
    linear(pad(extentOf(bubbles().map((b) => b.x))), [0, w()]),
  );
  const y = createMemo(() =>
    linear(pad(extentOf(bubbles().map((b) => b.y))), [h(), 0]),
  );
  const weights = createMemo(() => extentOf(bubbles().map((b) => b.weight)));
  const order = createMemo(
    () =>
      props.categories ?? [...new Set(bubbles().map((b) => b.category ?? ""))],
  );
  return (
    <>
      {(() => {
        const _bubblesSnapshot = bubbles();
        return _bubblesSnapshot.length ? (
          <PlotFrame
            width={props.width}
            height={props.height}
            margin={m}
            x={x()}
            y={y()}
            xLabel={props.xLabel}
            yLabel={props.yLabel}
            title={_titleSlot()}
          >
            <For each={_bubblesSnapshot}>
              {(b) => (
                <circle
                  class={s.bubble}
                  cx={px(x()(b.x))}
                  cy={px(y()(b.y))}
                  r={px(radiusFor(b.weight, weights()))}
                  style={{
                    fill:
                      categorical(order().indexOf(b.category ?? "")) ??
                      "var(--chart-neutral)",
                  }}
                >
                  <title>{`${b.label ?? b.id} · ${b.weight}`}</title>
                </circle>
              )}
            </For>
          </PlotFrame>
        ) : (
          <p class={s.message}>
            {props.bubbles.length
              ? "Measurements unavailable."
              : "No measurements to display."}
          </p>
        );
      })()}
      <ChartData title={_titleSlot()}>
        <THead>
          <Tr>
            <Th>Point</Th>
            <Th>Category</Th>
            <Th numeric>{props.xLabel ?? "X"}</Th>
            <Th numeric>{props.yLabel ?? "Y"}</Th>
            <Th numeric>Weight</Th>
          </Tr>
        </THead>
        <TBody>
          <For each={props.bubbles}>
            {(bubble) => (
              <Tr>
                <Th scope="row">{bubble.label ?? bubble.id}</Th>
                <Td>{bubble.category ?? "Uncategorized"}</Td>
                {
                  <For each={[bubble.x, bubble.y, bubble.weight]}>
                    {(value, index) => (
                      <Td numeric>
                        {Number.isFinite(value) && (index() !== 2 || value >= 0)
                          ? String(value)
                          : "Unavailable"}
                      </Td>
                    )}
                  </For>
                }
              </Tr>
            )}
          </For>
        </TBody>
      </ChartData>
    </>
  );
}
