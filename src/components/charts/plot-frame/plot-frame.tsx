import type { JSX } from "solid-js";
import { createMemo, For, mergeProps } from "solid-js";
import type { Scale } from "../_kernel/scale";
import { px } from "../_kernel/scale";
import s from "./plot-frame.module.css";
export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
export const DEFAULT_MARGIN: Margin = {
  top: 14,
  right: 18,
  bottom: 38,
  left: 48,
};
export type PlotFrameProps = {
  width: number;
  height: number;
  margin?: Partial<Margin>;
  x?: Scale;
  y?: Scale;
  xLabel?: string;
  yLabel?: string;
  /** Horizontal rules at these y values. A significance cut, a target, a zero
   *  line — the thing the reader is comparing against. */
  rules?: {
    y?: number;
    x?: number;
    label?: string;
  }[];
  grid?: boolean;
  /** Anything drawn inside the plot area. Given in PLOT coordinates: the frame
   *  has already translated past the margin. */
  children?: JSX.Element;
  /** Painted after axes and ticks, in the same plot coordinates as children. */
  overlay?: JSX.Element;
  title: string;
  class?: string;
};

/** The frame every statistical chart in this family shares: scales in, axes,
 *  grid, rules, and a plot area for the marks.
 *
 *  # One axis, always
 *
 *  There is no second y-scale and there will not be one. Two measures of
 *  different scale on one frame is the single most common charting mistake —
 *  the crossing point of the two series is an artefact of where the axes were
 *  put, and a reader cannot see that. Two measures means two charts, small
 *  multiples, or indexing both to a common base.
 *
 *  # Why the marks are children and not a prop
 *
 *  A `data` prop would make this component know about every mark type in the
 *  catalogue, and adding a mark would mean editing the frame. As children, the
 *  frame owns the space and the marks own themselves — which is what lets a
 *  volcano plot and a heatmap share it without either knowing the other exists.
 */
export function PlotFrame(incomingProps: PlotFrameProps) {
  const props = mergeProps(
    {
      grid: true,
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const m = createMemo(() => ({
    ...DEFAULT_MARGIN,
    ...props.margin,
  }));
  const w = createMemo(() => Math.max(1, props.width - m().left - m().right));
  const h = createMemo(() => Math.max(1, props.height - m().top - m().bottom));
  return (
    <div
      class={s.viewport}
      role="region"
      aria-label={`${_titleSlot()} plot`}
      tabindex={0}
    >
      <svg
        viewBox={`0 0 ${px(props.width)} ${px(props.height)}`}
        width={px(props.width)}
        height={px(props.height)}
        class={[s.frame, props.class].filter(Boolean).join(" ")}
        role="img"
        aria-label={_titleSlot()}
      >
        {_titleSlot() ? <title>{_titleSlot()}</title> : null}

        <g transform={`translate(${px(m().left)} ${px(m().top)})`}>
          {props.grid && props.y
            ? props.y
                .ticks()
                .map((t) => (
                  <line
                    class={s.grid}
                    x1={0}
                    x2={px(w())}
                    y1={px(props.y!(t))}
                    y2={px(props.y!(t))}
                  />
                ))
            : null}
          {props.grid && props.x
            ? props.x
                .ticks()
                .map((t) => (
                  <line
                    class={s.grid}
                    y1={0}
                    y2={px(h())}
                    x1={px(props.x!(t))}
                    x2={px(props.x!(t))}
                  />
                ))
            : null}

          {/* Rules sit ABOVE the grid and below the marks: they are a value the
            reader compares against, so they must not be mistaken for grid. */}
          {
            <For each={props.rules}>
              {(r) => (
                <>
                  {r.y !== undefined && props.y ? (
                    <line
                      class={s.rule}
                      x1={0}
                      x2={px(w())}
                      y1={px(props.y(r.y))}
                      y2={px(props.y(r.y))}
                    />
                  ) : r.x !== undefined && props.x ? (
                    <line
                      class={s.rule}
                      y1={0}
                      y2={px(h())}
                      x1={px(props.x(r.x))}
                      x2={px(props.x(r.x))}
                    />
                  ) : null}
                </>
              )}
            </For>
          }

          {props.children}

          {/* Axes last, so a mark at the edge cannot paint over the line the
            reader measures it against. */}
          <line class={s.axis} x1={0} y1={px(h())} x2={px(w())} y2={px(h())} />
          <line class={s.axis} x1={0} y1={0} x2={0} y2={px(h())} />

          {
            <For each={props.x?.ticks()}>
              {(t) => (
                <text
                  class={s.tick}
                  x={px(props.x!(t))}
                  y={px(h() + 15)}
                  text-anchor="middle"
                >
                  {format(t)}
                </text>
              )}
            </For>
          }
          {
            <For each={props.y?.ticks()}>
              {(t) => (
                <text
                  class={s.tick}
                  x={-8}
                  y={px(props.y!(t) + 3.5)}
                  text-anchor="end"
                >
                  {format(t)}
                </text>
              )}
            </For>
          }

          {props.overlay}
        </g>

        {props.xLabel ? (
          <text
            class={s.axisLabel}
            x={px(m().left + w() / 2)}
            y={px(props.height - 4)}
            text-anchor="middle"
          >
            {props.xLabel}
          </text>
        ) : null}
        {props.yLabel ? (
          <text
            class={s.axisLabel}
            transform={`translate(11 ${px(m().top + h() / 2)}) rotate(-90)`}
            text-anchor="middle"
          >
            {props.yLabel}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

/** Short over exact. An axis label is read at a glance and `1.0000000000000002`
 *  is what floating point hands you for a tick that should say `1`. */
function format(n: number): string {
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a < 0.01) return n.toExponential(2);
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  if (a >= 10) return n.toFixed(0);
  if (a >= 1) return n.toFixed(1);
  return n.toFixed(2);
}
