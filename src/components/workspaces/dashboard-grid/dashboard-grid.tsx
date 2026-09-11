import type { JSX } from "solid-js";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Card, CardBody } from "~/components/display";
import { Button } from "~/components/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/overlays";
import { GripVertical, Settings } from "~/components/utility";
import type { GridItem } from "~/components/workspaces/dashboard-grid/model";
import { cn } from "~/lib/kernel";
import s from "./dashboard-grid.module.css";
import type { DashboardLayout, GridEdit } from "./model";
import { decodeDashboardLayout, editDashboardLayout, GRID } from "./model";
export type DashboardWidget = {
  id: string;
  title: string;
  content: () => JSX.Element;
};
export type DashboardGridProps = {
  label: string;
  widgets: readonly DashboardWidget[];
  layout: DashboardLayout;
  editable?: boolean;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onRemove?: (id: string) => void;
  empty?: JSX.Element;
  class?: string;
};
type Gesture = {
  id: string;
  mode: "move" | "resize";
  x: number;
  y: number;
  item: GridItem;
  baseline: DashboardLayout;
  preview: DashboardLayout;
  pointer: number;
};
const actions: readonly [GridEdit, string][] = [
  ["left", "Move left"],
  ["right", "Move right"],
  ["up", "Move up"],
  ["down", "Move down"],
  ["wider", "Make wider"],
  ["narrower", "Make narrower"],
  ["taller", "Make taller"],
  ["shorter", "Make shorter"],
];
export function DashboardGrid(props: DashboardGridProps) {
  const [width, setWidth] = createSignal(0),
    [announcement, setAnnouncement] = createSignal(""),
    [gesture, setGesture] = createSignal<Gesture | null>(null);
  let host!: HTMLDivElement;
  const stacked = () => width() < 640,
    editing = () => Boolean(props.editable && props.onLayoutChange),
    shown = () => gesture()?.preview ?? props.layout;
  function edit(id: string, action: GridEdit) {
    const next = editDashboardLayout(props.layout, id, action);
    if (next !== props.layout) {
      props.onLayoutChange?.(next);
      const item = next.find((x) => x.id === id)!;
      setAnnouncement(
        `${props.widgets.find((x) => x.id === id)?.title}: column ${item.x + 1}, row ${item.y + 1}, width ${item.width}, height ${item.height}.`,
      );
    }
  }
  function begin(event: PointerEvent, item: GridItem, mode: Gesture["mode"]) {
    if (!editing() || stacked() || event.button !== 0) return;
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement)
      event.currentTarget.setPointerCapture(event.pointerId);
    setGesture({
      id: item.id,
      mode,
      x: event.clientX,
      y: event.clientY,
      item: {
        ...item,
      },
      baseline: props.layout,
      preview: props.layout,
      pointer: event.pointerId,
    });
  }
  function move(event: PointerEvent) {
    const current = gesture();
    if (!current || current.pointer !== event.pointerId) return;
    const dx = Math.round(
        (event.clientX - current.x) / ((width() + 16) / GRID.columns),
      ),
      dy = Math.round((event.clientY - current.y) / 56);
    const item =
      current.mode === "move"
        ? {
            ...current.item,
            x: current.item.x + dx,
            y: current.item.y + dy,
          }
        : {
            ...current.item,
            width: current.item.width + dx,
            height: current.item.height + dy,
          };
    const parsed = decodeDashboardLayout(
      current.baseline.map((x) => (x.id === item.id ? item : x)),
    );
    if (parsed.ok)
      setGesture({
        ...current,
        preview: parsed.value,
      });
  }
  function finish(event: PointerEvent) {
    const current = gesture();
    if (!current || event.pointerId !== current.pointer) return;
    setGesture(null);
    if (
      editing() &&
      current.baseline === props.layout &&
      JSON.stringify(current.preview) !== JSON.stringify(props.layout)
    ) {
      props.onLayoutChange?.(current.preview);
      setAnnouncement(
        "Dashboard arrangement changed. Save to keep these changes.",
      );
    }
  }
  const cancel = () => setGesture(null),
    key = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
  onMount(() => {
    const resize = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    resize.observe(host);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
    onCleanup(() => {
      resize.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
    });
  });
  return (
    <div
      ref={host}
      class={cn(s.dashboard, props.class)}
      role="region"
      aria-label={props.label}
    >
      <span class={s.announcement} role="status">
        {announcement()}
      </span>
      <Show
        when={shown().length}
        fallback={
          <div class={s.empty}>
            {props.empty ??
              "No widgets yet. Add one to start arranging this dashboard."}
          </div>
        }
      >
        {editing() && stacked() && width() > 0 && (
          <p class={s.hint}>
            Widgets stack on narrow screens. Use a wider workspace to move and
            resize them.
          </p>
        )}
        <div class={stacked() ? s.stack : s.grid}>
          <For each={shown().map((x) => x.id)}>
            {(id) => {
              const item = () => shown().find((x) => x.id === id)!,
                widget = () => props.widgets.find((x) => x.id === id);
              return (
                <Show when={widget()}>
                  {(_key) => (
                    <div
                      class={s.item}
                      data-widget={id}
                      style={
                        stacked()
                          ? undefined
                          : {
                              "grid-column": `${item().x + 1}/span ${item().width}`,
                              "grid-row": `${item().y + 1}/span ${item().height}`,
                            }
                      }
                    >
                      <Card class={s.card}>
                        <div class={s.header}>
                          <div
                            class={cn(
                              s.heading,
                              editing() && !stacked() && s.dragHandle,
                            )}
                            onPointerDown={(event) =>
                              begin(event, item(), "move")
                            }
                          >
                            {editing() && !stacked() && (
                              <GripVertical size={15} aria-hidden="true" />
                            )}
                            <h3 class={s.title}>{widget()!.title}</h3>
                          </div>
                          {editing() && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild={(forwarded) => (
                                  <Button
                                    {...forwarded()}
                                    size="icon"
                                    intent="ghost"
                                    aria-label={`Arrange ${widget()!.title}`}
                                  >
                                    <Settings size={15} aria-hidden="true" />
                                  </Button>
                                )}
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  {widget()!.title}
                                </DropdownMenuLabel>
                                {!stacked() && (
                                  <For each={actions}>
                                    {([action, label]) => (
                                      <DropdownMenuItem
                                        disabled={
                                          editDashboardLayout(
                                            props.layout,
                                            id,
                                            action,
                                          ) === props.layout
                                        }
                                        onSelect={() => edit(id, action)}
                                      >
                                        {label}
                                      </DropdownMenuItem>
                                    )}
                                  </For>
                                )}
                                {props.onRemove && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() => props.onRemove?.(id)}
                                    >
                                      Remove widget
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <CardBody class={s.body}>
                          {widget()!.content()}
                        </CardBody>
                        {editing() && !stacked() && (
                          <button
                            type="button"
                            class={s.resize}
                            aria-label={`Resize ${widget()!.title}`}
                            onPointerDown={(event) =>
                              begin(event, item(), "resize")
                            }
                            onKeyDown={(event) => {
                              const action = (
                                {
                                  ArrowRight: "wider",
                                  ArrowLeft: "narrower",
                                  ArrowDown: "taller",
                                  ArrowUp: "shorter",
                                } as const
                              )[event.key as "ArrowRight"];
                              if (action) {
                                event.preventDefault();
                                edit(id, action);
                              }
                            }}
                          >
                            ↘
                          </button>
                        )}
                      </Card>
                    </div>
                  )}
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
