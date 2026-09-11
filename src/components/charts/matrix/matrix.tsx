import { createMemo, For, mergeProps } from "solid-js";
import { TBody, Td, Th, THead, Tr } from "~/components/display/table";
import { Button } from "~/components/forms";
import { divergingFill, sequentialFill } from "../_kernel/encode";
import { band, px } from "../_kernel/scale";
import { ChartData } from "../_shared/chart-data";
import s from "../marks.module.css";

/** Four states inherited from Overwatch: a measurement, measured absence,
 *  an unanswered question, and a question that does not apply. Keeping them
 *  distinct preserves coverage semantics as well as the picture. */
export type Cell =
  | {
      state: "value";
      value: number;
    }
  /** Looked, and there was nothing. A measured zero. */
  | {
      state: "absent";
    }
  /** Nobody asked. Not the same as a zero and never rendered as one. */
  | {
      state: "unattempted";
    }
  /** There is no question to ask here. Excluded from the ratio entirely. */
  | {
      state: "na";
    };
export type MatrixProps = {
  rows: readonly string[];
  columns: readonly string[];
  cell: (row: string, column: string) => Cell;
  width?: number;
  height?: number;
  /** `diverging` is signed about a midpoint; `sequential` is magnitude only. */
  ramp?: "diverging" | "sequential";
  /** Only for `diverging`. */
  midpoint?: number;
  extent?: number;
  title?: string;
  onSelect?: (row: string, column: string) => void;
};
export function Matrix(incomingProps: MatrixProps) {
  const props = mergeProps(
    {
      width: 520,
      ramp: "sequential",
      midpoint: 0,
      title: "Coverage matrix",
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const sampled = createMemo(
    () =>
      new Map(
        props.rows.map((row) => [
          row,
          new Map(
            props.columns.map((column) => [column, props.cell(row, column)]),
          ),
        ]),
      ),
  );
  const cell = (row: string, column: string) =>
    sampled().get(row)!.get(column)!;
  const m = {
    top: 8,
    right: 8,
    bottom: 76,
    left: 128,
  };
  const w = createMemo(() => Math.max(1, props.width - m.left - m.right));
  const cellSize = createMemo(() =>
    Math.max(8, w() / Math.max(1, props.columns.length)),
  );
  const h = createMemo(() =>
    props.height === undefined
      ? cellSize() * props.rows.length
      : Math.max(1, props.height - m.top - m.bottom),
  );
  const total = createMemo(() => props.height ?? h() + m.top + m.bottom);
  const x = createMemo(() => band(props.columns, [0, w()], 0.06));
  const y = createMemo(() => band(props.rows, [0, h()], 0.06));
  const span = createMemo(
    () =>
      props.extent ??
      Math.max(
        1e-9,
        ...props.rows.flatMap((r) =>
          props.columns.map((c) => {
            const v = cell(r, c);
            return v.state === "value" && Number.isFinite(v.value)
              ? Math.abs(v.value - props.midpoint)
              : 0;
          }),
        ),
      ),
  );
  return (
    <>
      {props.rows.length && props.columns.length ? (
        <div
          class={s.viewport}
          role="region"
          aria-label={`${_titleSlot()} plot`}
          tabindex={0}
        >
          <svg
            viewBox={`0 0 ${px(props.width)} ${px(total())}`}
            width={px(props.width)}
            height={px(total())}
            class={s.matrix}
            role={props.onSelect ? "group" : "img"}
            aria-label={_titleSlot()}
          >
            {_titleSlot() ? <title>{_titleSlot()}</title> : null}
            <g transform={`translate(${px(m.left)} ${px(m.top)})`}>
              <For each={props.rows}>
                {(r) =>
                  props.columns.map((c) => {
                    const v = cell(r, c);
                    const fill =
                      v.state !== "value" || !Number.isFinite(v.value)
                        ? undefined
                        : props.ramp === "diverging"
                          ? divergingFill((v.value - props.midpoint) / span())
                          : sequentialFill((v.value - props.midpoint) / span());
                    return (
                      <rect
                        class={s.cell}
                        data-state={
                          v.state === "value" && !Number.isFinite(v.value)
                            ? "unavailable"
                            : v.state
                        }
                        x={px(x()(c))}
                        y={px(y()(r))}
                        width={px(x().bandWidth)}
                        height={px(y().bandWidth)}
                        style={fill ? { fill } : undefined}
                        onClick={() => props.onSelect?.(r, c)}
                        role={props.onSelect ? "button" : undefined}
                        tabindex={props.onSelect ? 0 : undefined}
                        aria-label={
                          props.onSelect
                            ? `${r} · ${c} — ${describe(v)}`
                            : undefined
                        }
                        onKeyDown={(event) => {
                          if (!props.onSelect) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            props.onSelect?.(r, c);
                          }
                        }}
                      >
                        <title>{`${r} · ${c} — ${describe(v)}`}</title>
                      </rect>
                    );
                  })
                }
              </For>

              {/* `unattempted` gets a dotted outline rather than a fill, because it is
            the one state that is genuinely empty — and an empty cell with no
            mark at all is indistinguishable from a rendering failure. */}
              <For each={props.rows}>
                {(r) =>
                  props.columns.map((c) =>
                    cell(r, c).state === "unattempted" ? (
                      <rect
                        class={s.unattempted}
                        x={px(x()(c) + 0.5)}
                        y={px(y()(r) + 0.5)}
                        width={px(x().bandWidth - 1)}
                        height={px(y().bandWidth - 1)}
                      />
                    ) : null,
                  )
                }
              </For>

              {/* `na` gets a diagonal slash — a texture, so it survives being printed
            and is never mistaken for a low value. */}
              <For each={props.rows}>
                {(r) =>
                  props.columns.map((c) =>
                    cell(r, c).state === "na" ? (
                      <line
                        class={s.na}
                        x1={px(x()(c) + 2)}
                        y1={px(y()(r) + y().bandWidth - 2)}
                        x2={px(x()(c) + x().bandWidth - 2)}
                        y2={px(y()(r) + 2)}
                      />
                    ) : null,
                  )
                }
              </For>

              <For each={props.rows}>
                {(r) => (
                  <text
                    class={s.matrixLabel}
                    x={-6}
                    y={px(y()(r) + y().bandWidth / 2 + 3)}
                    text-anchor="end"
                  >
                    {r}
                  </text>
                )}
              </For>
              <For each={props.columns}>
                {(c) => (
                  <text
                    class={s.matrixLabel}
                    transform={`translate(${px(x()(c) + x().bandWidth / 2)} ${px(h() + 6)}) rotate(-42)`}
                    text-anchor="end"
                  >
                    {c}
                  </text>
                )}
              </For>
            </g>
          </svg>
        </div>
      ) : (
        <p class={s.message}>No measurements to display.</p>
      )}
      <ChartData title={_titleSlot()}>
        <THead>
          <Tr>
            <Th>Item</Th>
            <For each={props.columns}>{(column) => <Th>{column}</Th>}</For>
          </Tr>
        </THead>
        <TBody>
          <For each={props.rows}>
            {(row) => (
              <Tr>
                <Th scope="row">{row}</Th>
                <For each={props.columns}>
                  {(column) => (
                    <Td>
                      {props.onSelect ? (
                        <Button
                          size="sm"
                          intent="ghost"
                          aria-label={`Select ${row} · ${column}`}
                          onClick={() => props.onSelect?.(row, column)}
                        >
                          {describe(cell(row, column))}
                        </Button>
                      ) : (
                        describe(cell(row, column))
                      )}
                    </Td>
                  )}
                </For>
              </Tr>
            )}
          </For>
        </TBody>
      </ChartData>
    </>
  );
}
function describe(c: Cell): string {
  switch (c.state) {
    case "value":
      return Number.isFinite(c.value)
        ? String(c.value)
        : "Unavailable measurement";
    case "absent":
      return "looked, found nothing";
    case "unattempted":
      return "never checked";
    case "na":
      return "not applicable — no question to ask";
  }
}

/** N/a is excluded from both halves of coverage. Treating it as either a hit
 *  or a miss changes the ratio for a question that was never applicable.
 *  Returns null when nothing applies: a ratio over nothing is not zero. */
export function coverageOf(
  rows: readonly string[],
  columns: readonly string[],
  cell: (row: string, column: string) => Cell,
): {
  checked: number;
  applicable: number;
  ratio: number;
} | null {
  let checked = 0;
  let applicable = 0;
  for (const r of rows)
    for (const c of columns) {
      const v = cell(r, c);
      if (v.state === "na") continue;
      applicable++;
      if (
        (v.state === "value" && Number.isFinite(v.value)) ||
        v.state === "absent"
      )
        checked++;
    }
  return applicable === 0
    ? null
    : {
        checked,
        applicable,
        ratio: checked / applicable,
      };
}
