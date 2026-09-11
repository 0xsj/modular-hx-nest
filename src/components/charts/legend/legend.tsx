import { createMemo, For, mergeProps } from "solid-js";
import type { LegendItem } from "../_kernel/encode";
import { divergingFill, sequentialFill, shapePath } from "../_kernel/encode";
import { px } from "../_kernel/scale";
import s from "../legend.module.css";

/** Always present for two or more series, and it carries SHAPE as well as
 *  colour — identity is never colour alone. A single series needs no legend:
 *  the title names it. */
export function Legend(props: {
  items: readonly LegendItem[];
  class?: string;
}) {
  return (
    <>
      {props.items.length < 2 ? null : (
        <ul
          class={[s.legend, props.class].filter(Boolean).join(" ")}
          aria-label="Chart categories"
        >
          <For each={props.items}>
            {(item) => (
              <li>
                <svg viewBox="-8 -8 16 16" aria-hidden="true" class={s.swatch}>
                  <path
                    d={shapePath(item.shape ?? "circle", 5)}
                    style={{
                      fill: item.fill ?? "var(--chart-grid)",
                    }}
                  />
                </svg>
                {item.label}
              </li>
            )}
          </For>
        </ul>
      )}
    </>
  );
}

/** The continuous ramp printed beside the marks that use it.
 *
 *  Rendered as discrete steps rather than an SVG gradient, deliberately: a
 *  gradient invites reading a precise value off a smear, and a stepped bar
 *  admits that the eye can resolve about seven levels and no more. */
export function ColourBar(incomingProps: {
  kind?: "sequential" | "diverging";
  domain: readonly [number, number];
  midpoint?: number;
  label?: string;
  steps?: number;
  width?: number;
}) {
  const props = mergeProps(
    {
      kind: "sequential",
      midpoint: 0,
      steps: 9,
      width: 180,
    } as const,
    incomingProps,
  );
  const steps = createMemo(() =>
    Number.isFinite(props.steps)
      ? Math.max(2, Math.min(64, Math.floor(props.steps)))
      : 9,
  );
  const extent = createMemo(() =>
    Math.max(
      1e-9,
      Math.abs(props.domain[0] - props.midpoint),
      Math.abs(props.domain[1] - props.midpoint),
    ),
  );
  const cells = createMemo(() => {
    const count = steps(),
      domain = props.domain,
      midpoint = props.midpoint,
      kind = props.kind,
      spread = extent();
    return Array.from({ length: count }, (_, i) => {
      const fraction = i / (count - 1);
      const value = domain[0] + fraction * (domain[1] - domain[0]);
      const t = kind === "diverging" ? (value - midpoint) / spread : fraction;
      return {
        t,
        fill: kind === "diverging" ? divergingFill(t) : sequentialFill(t),
      };
    });
  });
  const cellWidth = createMemo(() => props.width / steps());
  return (
    <figure class={s.bar}>
      <svg
        viewBox={`0 0 ${px(props.width)} 26`}
        class={s.barSvg}
        style={{
          "inline-size": `${props.width}px`,
        }}
        aria-hidden="true"
      >
        {
          <For each={cells()}>
            {(c, i) => (
              <rect
                x={px(i() * cellWidth())}
                y={0}
                width={px(cellWidth())}
                height={10}
                style={{
                  fill: c.fill,
                }}
              />
            )}
          </For>
        }
        <text class={s.barTick} x={0} y={23}>
          {fmt(props.domain[0])}
        </text>
        {props.kind === "diverging" ? (
          <text
            class={s.barTick}
            x={px(
              props.domain[1] === props.domain[0]
                ? props.width / 2
                : ((props.midpoint - props.domain[0]) /
                    (props.domain[1] - props.domain[0])) *
                    props.width,
            )}
            y={23}
            text-anchor="middle"
          >
            {fmt(props.midpoint)}
          </text>
        ) : null}
        <text class={s.barTick} x={px(props.width)} y={23} text-anchor="end">
          {fmt(props.domain[1])}
        </text>
      </svg>
      <figcaption>
        {props.label ?? "Color scale"} · {props.domain[0]}
        {props.kind === "diverging" ? ` · ${props.midpoint}` : ""} ·{" "}
        {props.domain[1]}
      </figcaption>
    </figure>
  );
}

/** The three kinds of nothing, printed. Any screen using `Matrix` needs this or
 *  the distinction it went to trouble to keep is one the reader cannot decode. */
export function NothingKey() {
  return (
    <ul class={s.legend}>
      <li>
        <span class={s.chipAbsent} aria-hidden="true" />
        looked, found nothing
      </li>
      <li>
        <span class={s.chipUnattempted} aria-hidden="true" />
        never checked
      </li>
      <li>
        <span class={s.chipNa} aria-hidden="true" />
        not applicable — excluded from the ratio
      </li>
    </ul>
  );
}
const fmt = (n: number) =>
  Math.abs(n) >= 1000
    ? `${(n / 1000).toFixed(1)}k`
    : String(Math.round(n * 100) / 100);
