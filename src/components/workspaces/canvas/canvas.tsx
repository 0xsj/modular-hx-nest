import type { JSX } from "solid-js";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Button } from "~/components/forms";
import { cn } from "~/lib/kernel";
import s from "./canvas.module.css";
export type CanvasNode = {
  id: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  content: () => JSX.Element;
};
export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};
export type CanvasProps = {
  label: string;
  nodes: readonly CanvasNode[];
  edges?: readonly CanvasEdge[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onPositionsChange?: (
    positions: ReadonlyMap<
      string,
      {
        x: number;
        y: number;
      }
    >,
  ) => void;
  empty?: JSX.Element;
  class?: string;
};
type View = {
  x: number;
  y: number;
  zoom: number;
};
type Drag = {
  pointer: number;
  x: number;
  y: number;
  node?: CanvasNode;
  view: View;
  start: {
    x: number;
    y: number;
  };
  moved: boolean;
};
/** Native pointer/keyboard adapter. Positions belong to the caller; viewport
 * and measurements belong to this component and are never persisted as data. */
export function Canvas(props: CanvasProps) {
  let host!: HTMLDivElement;
  const [view, setView] = createSignal<View>({
      x: 50,
      y: 50,
      zoom: 1,
    }),
    [drag, setDrag] = createSignal<Drag | null>(null),
    [measurements, setMeasurements] = createSignal(
      new Map<
        string,
        {
          width: number;
          height: number;
        }
      >(),
    );
  const nodeById = createMemo(
    () => new Map(props.nodes.map((node) => [node.id, node])),
  );
  function fit() {
    if (!props.nodes.length) return;
    const left = Math.min(...props.nodes.map((n) => n.position.x)),
      top = Math.min(...props.nodes.map((n) => n.position.y));
    const right = Math.max(...props.nodes.map((n) => n.position.x + 220)),
      bottom = Math.max(
        ...props.nodes.map(
          (n) => n.position.y + (measurements().get(n.id)?.height ?? 150),
        ),
      );
    const zoom = Math.min(
      1.5,
      Math.max(
        0.25,
        Math.min(
          (host.clientWidth - 90) / (right - left),
          (host.clientHeight - 90) / (bottom - top),
        ),
      ),
    );
    setView({
      x: (host.clientWidth - (right - left) * zoom) / 2 - left * zoom,
      y: (host.clientHeight - (bottom - top) * zoom) / 2 - top * zoom,
      zoom,
    });
  }
  function zoom(factor: number) {
    setView((v) => {
      const next = Math.min(2, Math.max(0.25, v.zoom * factor));
      return {
        x:
          host.clientWidth / 2 - ((host.clientWidth / 2 - v.x) * next) / v.zoom,
        y:
          host.clientHeight / 2 -
          ((host.clientHeight / 2 - v.y) * next) / v.zoom,
        zoom: next,
      };
    });
  }
  function begin(event: PointerEvent, node?: CanvasNode) {
    if (event.button !== 0 || (node && !props.onPositionsChange)) return;
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("button,input,a,textarea,select")
    )
      return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setDrag({
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      node,
      view: view(),
      start: node?.position ?? {
        x: view().x,
        y: view().y,
      },
      moved: false,
    });
  }
  function move(event: PointerEvent) {
    const current = drag();
    if (!current || event.pointerId !== current.pointer) return;
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3 && !current.moved)
      setDrag({
        ...current,
        moved: true,
      });
    if (current.node)
      props.onPositionsChange?.(
        new Map([
          [
            current.node.id,
            {
              x: current.start.x + dx / current.view.zoom,
              y: current.start.y + dy / current.view.zoom,
            },
          ],
        ]),
      );
    else
      setView({
        ...current.view,
        x: current.start.x + dx,
        y: current.start.y + dy,
      });
  }
  function finish(event: PointerEvent) {
    const current = drag();
    if (!current || event.pointerId !== current.pointer) return;
    setDrag(null);
    if (!current.moved) props.onSelect?.(current.node?.id ?? null);
  }
  function cancel() {
    const current = drag();
    if (current?.node)
      props.onPositionsChange?.(new Map([[current.node.id, current.start]]));
    else if (current) setView(current.view);
    setDrag(null);
  }
  onMount(() => {
    fit();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    onCleanup(() => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    });
  });
  function measure(element: HTMLDivElement, id: string) {
    onMount(() => {
      const observer = new ResizeObserver(([entry]) =>
        setMeasurements((previous) => {
          const next = new Map(previous);
          next.set(id, {
            width: entry.contentRect.width,
            height: element.offsetHeight,
          });
          return next;
        }),
      );
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
  }
  return (
    <div
      ref={host}
      class={cn(s.canvas, props.class)}
      role="region"
      aria-label={props.label}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          cancel();
          props.onSelect?.(null);
        }
      }}
    >
      <Show
        when={props.nodes.length}
        fallback={
          <div class={s.empty}>{props.empty ?? "No items on this canvas."}</div>
        }
      >
        <div
          class={s.pane}
          onPointerDown={(event) => begin(event)}
          onWheel={(event) => {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey)
              zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1);
            else
              setView((v) => ({
                ...v,
                x: v.x - event.deltaX,
                y: v.y - event.deltaY,
              }));
          }}
        >
          <div
            class={s.viewport}
            style={{
              transform: `translate(${view().x}px,${view().y}px) scale(${view().zoom})`,
            }}
          >
            <svg
              data-canvas-edges
              class={s.edges}
              aria-label="Canvas connections"
              role="img"
            >
              <For
                each={(props.edges ?? []).filter((e) => {
                  const _nodeByIdSnapshot = nodeById();
                  return (
                    _nodeByIdSnapshot.has(e.source) &&
                    _nodeByIdSnapshot.has(e.target)
                  );
                })}
              >
                {(edge) => {
                  const path = () => {
                    const a = nodeById().get(edge.source)!,
                      b = nodeById().get(edge.target)!;
                    const x1 = a.position.x + 220,
                      y1 =
                        a.position.y +
                        (measurements().get(a.id)?.height ?? 150) / 2,
                      x2 = b.position.x,
                      y2 =
                        b.position.y +
                        (measurements().get(b.id)?.height ?? 150) / 2;
                    return `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
                  };
                  return (
                    <path d={path()} data-canvas-edge class={s.edge}>
                      <title>
                        {edge.label ??
                          `${nodeById().get(edge.source)?.label} to ${nodeById().get(edge.target)?.label}`}
                      </title>
                    </path>
                  );
                }}
              </For>
            </svg>
            <For each={props.nodes.map((node) => node.id)}>
              {(id) => {
                const node = () => nodeById().get(id)!;
                return (
                  <div
                    ref={(element) => measure(element, id)}
                    class={s.node}
                    data-node-id={id}
                    data-selected={props.selectedId === id ? "" : undefined}
                    role="group"
                    aria-roledescription="canvas item"
                    aria-label={node().label}
                    tabindex={0}
                    style={{
                      transform: `translate(${node().position.x}px,${node().position.y}px)`,
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      props.onSelect?.(id);
                      begin(event, node());
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onSelect?.(id);
                    }}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Escape") {
                        event.preventDefault();
                        props.onSelect?.(null);
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        props.onSelect?.(id);
                      }
                      const direction = (
                        {
                          ArrowLeft: [-1, 0],
                          ArrowRight: [1, 0],
                          ArrowUp: [0, -1],
                          ArrowDown: [0, 1],
                        } as const
                      )[event.key as "ArrowLeft"];
                      if (direction && props.onPositionsChange) {
                        event.preventDefault();
                        props.onSelect?.(id);
                        const step = event.shiftKey ? 10 : 1;
                        props.onPositionsChange(
                          new Map([
                            [
                              id,
                              {
                                x: node().position.x + direction[0] * step,
                                y: node().position.y + direction[1] * step,
                              },
                            ],
                          ]),
                        );
                      }
                    }}
                  >
                    {node().content()}
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        <div class={s.controls} role="group" aria-label="Canvas view">
          <Button size="sm" aria-label="Zoom in" onClick={() => zoom(1.2)}>
            +
          </Button>
          <Button size="sm" aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
            −
          </Button>
          <Button size="sm" aria-label="Fit view" onClick={fit}>
            Fit
          </Button>
        </div>
      </Show>
    </div>
  );
}
