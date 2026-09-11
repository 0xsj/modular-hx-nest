import type { JSX } from "solid-js";
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js";
import { TBody, Td, Th, THead, Tr } from "~/components/display/table";
import { Button } from "~/components/forms";
import type { MarkShape } from "../_kernel/encode";
import { shapePath } from "../_kernel/encode";
import type { GraphInput, LayoutName } from "../_kernel/layout";
import {
  circular,
  columns,
  concentric,
  force,
  grid,
  tiered,
  type Placement,
  type Point,
} from "../_kernel/layout";
import { cose } from "../_kernel/layout-cose";
import { px } from "../_kernel/scale";
import { ChartData } from "../_shared/chart-data";
import s from "./graph-frame.module.css";
export type GraphNode = {
  id: string;
  label?: string;
  /** Which tier or class. Drives `tiered` layout and the shape channel. */
  group?: string | number;
  /** Mark radius in pixels. Use radiusFor to encode a numeric value by area. */
  size?: number;
  fill?: string | null;
  shape?: MarkShape;
};
export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
  /** A second edge KIND, drawn differently. Not a weight. */
  kind?: string;
  /** `-1 .. 1`, for a signed network. Drives hue where present. */
  signed?: number;
  width?: number;
};
export type GraphFrameProps = {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  width: number;
  height: number;
  layout?: LayoutName;
  /** Required by `concentric`; ignored by every other layout. */
  rootId?: string;
  /** Tier order for `tiered`. Absent means insertion order. */
  groupOrder?: readonly (string | number)[];
  /** Positions a person dragged. A pin wins outright. */
  pins?: ReadonlyMap<string, Point>;
  /** Curve the edges. Straight is right for a radial layout; an arc separates
   *  parallel edges and reads better on a circular one. */
  curved?: boolean;
  labels?: boolean;
  /** Translucent hulls behind groups of nodes — the enrichment-map annotation
   *  layer. Drawn under everything. */
  hulls?: {
    ids: readonly string[];
    label?: string;
    fill?: string;
  }[];
  onSelect?: (id: string | null) => void;
  selected?: string | null;
  title?: string;
  class?: string;
  children?: JSX.Element;
};
const DEFAULT_R = 6;

/** Shared SVG geometry; pointer and selection state do not recompute layout. */
export function GraphFrame(incomingProps: GraphFrameProps) {
  const props = mergeProps(
    {
      layout: "force",
      curved: false,
      labels: true,
      title: "Network diagram",
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const [hovered, setHovered] = createSignal<string | null>(null);
  const nodeById = createMemo(
    () => new Map(props.nodes.map((node) => [node.id, node])),
  );
  const placement = createMemo<Placement>(() => {
    const input: GraphInput = {
      nodes: props.nodes,
      edges: props.edges,
      width: props.width,
      height: props.height,
      pins: props.pins,
    };
    switch (props.layout) {
      case "concentric":
        return concentric(input, props.rootId ?? props.nodes[0]?.id ?? "");
      case "circular":
        return circular(input);
      case "tiered":
        return tiered(input, props.groupOrder);
      case "columns":
        return columns(input);
      case "grid":
        return grid(input);
      case "force":
        return force(input);
      case "cose":
      default:
        return cose(input);
    }
  });
  const lit = createMemo(() => hovered() ?? props.selected ?? null);

  /** One hop from the lit node. Computed here rather than per-mark so the cost
   *  is one pass over the edges instead of one per node. */
  const near = createMemo(() => {
    const selected = lit();
    if (selected === null) return null;
    const ids = new Set<string>([selected]);
    for (const e of props.edges) {
      if (e.from === lit()) ids.add(e.to);
      if (e.to === lit()) ids.add(e.from);
    }
    return ids;
  });
  const markOf = (id: string) => {
    const _nearSnapshot = near();
    return _nearSnapshot === null
      ? undefined
      : id === lit()
        ? "lit"
        : _nearSnapshot.has(id)
          ? "near"
          : "dim";
  };

  // Layout dimensions describe the node field. Give annotations and labels
  // their own margin so the frame does not crop the very groups it names.
  const bounds = createMemo(() => {
    let left = 0,
      top = 0,
      right = props.width,
      bottom = props.height;
    for (const node of props.nodes) {
      const at = placement().get(node.id);
      if (at) {
        left = Math.min(left, at.x - 40);
        right = Math.max(right, at.x + 40);
        top = Math.min(top, at.y - 20);
        bottom = Math.max(bottom, at.y + 30);
      }
    }
    for (const hull of props.hulls ?? []) {
      const points = hull.ids.flatMap((id) => {
        const _placementSnapshot = placement();
        return nodeById().has(id) && _placementSnapshot.has(id)
          ? [_placementSnapshot.get(id)!]
          : [];
      });
      if (!points.length) continue;
      const cx =
        points.reduce((sum, point) => sum + point.x, 0) / points.length;
      const cy =
        points.reduce((sum, point) => sum + point.y, 0) / points.length;
      const radius =
        Math.max(
          28,
          ...points.map((point) =>
            Math.sqrt((point.x - cx) ** 2 + (point.y - cy) ** 2),
          ),
        ) + 22;
      left = Math.min(left, cx - radius * 1.15);
      right = Math.max(right, cx + radius * 1.15);
      top = Math.min(top, cy - radius - 22);
      bottom = Math.max(bottom, cy + radius);
    }
    return {
      left,
      top,
      right,
      bottom,
    };
  });
  return (
    <>
      {props.nodes.length ? (
        <div
          class={s.viewport}
          role="region"
          aria-label={`${_titleSlot()} plot`}
          tabindex={0}
        >
          <svg
            viewBox={`${px(bounds().left)} ${px(bounds().top)} ${px(bounds().right - bounds().left)} ${px(bounds().bottom - bounds().top)}`}
            width={px(bounds().right - bounds().left)}
            height={px(bounds().bottom - bounds().top)}
            class={[s.frame, props.class].filter(Boolean).join(" ")}
            role={props.onSelect ? "group" : "img"}
            aria-label={_titleSlot()}
            data-lit={lit() ? "" : undefined}
          >
            {_titleSlot() ? <title>{_titleSlot()}</title> : null}

            {/* Hulls first — an annotation layer behind the graph, never on top of a
             label. This is the enrichment map's shading and it is the one thing in
             the catalogue that is drawn rather than computed. */}
            {
              <For each={props.hulls}>
                {(hull) => (
                  <>
                    {(() => {
                      const pts = hull.ids
                        .map((id) => placement().get(id))
                        .filter(Boolean) as Point[];
                      if (pts.length === 0) return null;
                      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
                      const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
                      const r =
                        Math.max(
                          28,
                          ...pts.map((p) =>
                            Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2),
                          ),
                        ) + 22;
                      return (
                        <g>
                          <ellipse
                            class={s.hull}
                            cx={px(cx)}
                            cy={px(cy)}
                            rx={px(r * 1.15)}
                            ry={px(r)}
                            style={
                              hull.fill
                                ? {
                                    fill: hull.fill,
                                  }
                                : undefined
                            }
                          />
                          {hull.label ? (
                            <text
                              class={s.hullLabel}
                              x={px(cx)}
                              y={px(cy - r - 5)}
                              text-anchor="middle"
                            >
                              {hull.label}
                            </text>
                          ) : null}
                        </g>
                      );
                    })()}
                  </>
                )}
              </For>
            }

            <g class={s.edges}>
              <For each={props.edges}>
                {(edge) => {
                  const points = createMemo(() => {
                    const a = placement().get(edge.from),
                      b = placement().get(edge.to);
                    return a &&
                      b &&
                      nodeById().has(edge.from) &&
                      nodeById().has(edge.to)
                      ? {
                          a,
                          b,
                        }
                      : null;
                  });
                  return (
                    <Show when={points()}>
                      {(p) => (
                        <path
                          class={s.edge}
                          d={edgePath(p().a, p().b, props.curved)}
                          data-kind={edge.kind}
                          data-sign={
                            edge.signed === undefined
                              ? undefined
                              : edge.signed < 0
                                ? "negative"
                                : "positive"
                          }
                          data-faded={
                            (near() !== null &&
                              edge.from !== lit() &&
                              edge.to !== lit()) ||
                            undefined
                          }
                          style={{
                            "stroke-width": edge.width,
                            stroke:
                              edge.signed === undefined
                                ? undefined
                                : edge.signed >= 0
                                  ? "var(--chart-pos)"
                                  : "var(--chart-neg)",
                            "stroke-opacity":
                              edge.signed === undefined
                                ? undefined
                                : 0.25 +
                                  Math.min(1, Math.abs(edge.signed)) * 0.6,
                          }}
                        />
                      )}
                    </Show>
                  );
                }}
              </For>
            </g>

            <g class={s.nodes}>
              <For each={props.nodes}>
                {(n) => {
                  const at = createMemo(() => placement().get(n.id));
                  const r = n.size ?? DEFAULT_R;
                  return (
                    <g
                      class={s.node}
                      transform={`translate(${px(at()?.x ?? 0)} ${px(at()?.y ?? 0)})`}
                      data-mark={markOf(n.id)}
                      data-selected={props.selected === n.id ? "" : undefined}
                      onMouseEnter={() => setHovered(n.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() =>
                        props.onSelect?.(props.selected === n.id ? null : n.id)
                      }
                      role={props.onSelect ? "button" : undefined}
                      aria-label={
                        props.onSelect ? (n.label ?? n.id) : undefined
                      }
                      aria-pressed={
                        props.onSelect ? props.selected === n.id : undefined
                      }
                      onKeyDown={(event) => {
                        if (!props.onSelect) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          props.onSelect?.(
                            props.selected === n.id ? null : n.id,
                          );
                        }
                      }}
                      tabindex={props.onSelect ? 0 : undefined}
                      onFocus={() => setHovered(n.id)}
                      onBlur={() => setHovered(null)}
                    >
                      <path
                        class={s.mark}
                        d={shapePath(n.shape ?? "circle", r)}
                        style={
                          n.fill
                            ? {
                                fill: n.fill,
                              }
                            : undefined
                        }
                      />
                      {props.labels && n.label ? (
                        <text class={s.label} y={r + 11} text-anchor="middle">
                          {n.label}
                        </text>
                      ) : null}
                    </g>
                  );
                }}
              </For>
            </g>

            {props.children}
          </svg>
        </div>
      ) : (
        <p class={s.message}>No nodes to display.</p>
      )}
      <ChartData title={`${_titleSlot()} nodes`}>
        <THead>
          <Tr>
            <Th>Node</Th>
            <Th>Group</Th>
            {props.onSelect && <Th>Selection</Th>}
          </Tr>
        </THead>
        <TBody>
          <For each={props.nodes}>
            {(node) => (
              <Tr>
                <Th scope="row">{node.label ?? node.id}</Th>
                <Td>{node.group ?? "Ungrouped"}</Td>
                {props.onSelect && (
                  <Td>
                    <Button
                      size="sm"
                      intent="ghost"
                      aria-label={`Select ${node.label ?? node.id}`}
                      aria-pressed={props.selected === node.id}
                      onClick={() =>
                        props.onSelect?.(
                          props.selected === node.id ? null : node.id,
                        )
                      }
                    >
                      {props.selected === node.id ? "Selected" : "Select"}
                    </Button>
                  </Td>
                )}
              </Tr>
            )}
          </For>
        </TBody>
      </ChartData>
      <ChartData title={`${_titleSlot()} connections`}>
        <THead>
          <Tr>
            <Th>From</Th>
            <Th>To</Th>
            <Th>Kind</Th>
            <Th numeric>Value</Th>
          </Tr>
        </THead>
        <TBody>
          {
            <For
              each={props.edges.filter((edge) => {
                const _nodeByIdSnapshot2 = nodeById();
                return (
                  _nodeByIdSnapshot2.has(edge.from) &&
                  _nodeByIdSnapshot2.has(edge.to)
                );
              })}
            >
              {(edge) => (
                <Tr>
                  <Th scope="row">
                    {nodeById().get(edge.from)?.label ?? edge.from}
                  </Th>
                  <Td>{nodeById().get(edge.to)?.label ?? edge.to}</Td>
                  <Td>{edge.label ?? edge.kind ?? "Connection"}</Td>
                  <Td numeric>
                    {edge.signed === undefined
                      ? "Unweighted"
                      : String(edge.signed)}
                  </Td>
                </Tr>
              )}
            </For>
          }
        </TBody>
      </ChartData>
    </>
  );
}

/** Straight, or a shallow arc.
 *
 *  Straight is right for a radial layout — a curve bows every spoke away from
 *  the centre it is pointing at, which is the one thing the layout exists to
 *  show. An arc earns its place on a circular layout, where every edge is a
 *  chord and straight ones overlap into a solid disc. */
function edgePath(a: Point, b: Point, curved: boolean): string {
  if (!curved) return `M ${px(a.x)} ${px(a.y)} L ${px(b.x)} ${px(b.y)}`;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // `sqrt`, not `hypot` — see `_kernel/layout`. This one is single-shot so the
  // divergence would be sub-pixel, and using the exact function everywhere is
  // cheaper than remembering which calls are safe.
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular offset proportional to length, so short edges stay nearly
  // straight and long ones bow enough to be told apart.
  const bow = Math.min(distance * 0.18, 46);
  const mx = (a.x + b.x) / 2 - (dy / distance) * bow;
  const my = (a.y + b.y) / 2 + (dx / distance) * bow;
  return `M ${px(a.x)} ${px(a.y)} Q ${px(mx)} ${px(my)} ${px(b.x)} ${px(b.y)}`;
}
