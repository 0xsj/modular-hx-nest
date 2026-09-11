import { createMemo, createSignal, mergeProps } from "solid-js";
import { Stat } from "~/components/display";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import type { DashboardLayout } from "~/components/workspaces";
import { Canvas, DashboardGrid } from "~/components/workspaces";
const initial: DashboardLayout = [
  {
    id: "a",
    x: 0,
    y: 0,
    width: 6,
    height: 4,
  },
  {
    id: "b",
    x: 6,
    y: 0,
    width: 6,
    height: 4,
  },
];
export function GridDemo(incomingProps: {
  readOnly?: boolean;
  empty?: boolean;
}) {
  const props = mergeProps(
    {
      readOnly: false,
      empty: false,
    } as const,
    incomingProps,
  );
  const _emptySlot = createMemo(() => props.empty);
  const [layout, setLayout] = createSignal(_emptySlot() ? [] : initial);
  return (
    <Flex direction="column" gap={6}>
      {!props.readOnly && !_emptySlot() && (
        <Button size="sm" onClick={() => setLayout(initial)}>
          Reset arrangement
        </Button>
      )}
      <DashboardGrid
        label={
          props.readOnly
            ? "Read-only dashboard"
            : _emptySlot()
              ? "Empty dashboard"
              : "Editable dashboard example"
        }
        layout={layout()}
        editable={!props.readOnly}
        onLayoutChange={setLayout}
        widgets={[
          {
            id: "a",
            title: "Measured",
            content: () => (
              <Stat label="Completed tasks" value={0} hint="a real zero" />
            ),
          },
          {
            id: "b",
            title: "Unmeasured",
            content: () => (
              <Stat label="Pending estimate" hint="no measurement yet" />
            ),
          },
        ]}
      />
    </Flex>
  );
}
export function CanvasDemo(incomingProps: {
  empty?: boolean;
  readOnly?: boolean;
}) {
  const props = mergeProps(
    {
      empty: false,
      readOnly: false,
    } as const,
    incomingProps,
  );
  const _emptySlot2 = createMemo(() => props.empty);
  const [position, setPosition] = createSignal({
    x: 0,
    y: 0,
  });
  const [selectedId, select] = createSignal<string | null>(null);
  return (
    <Canvas
      label={
        _emptySlot2()
          ? "Empty canvas"
          : props.readOnly
            ? "Locked canvas"
            : "Interactive canvas example"
      }
      nodes={
        _emptySlot2()
          ? []
          : [
              {
                id: "item",
                label: "An idea",
                position: position(),
                content: () => <Text weight="strong">An idea</Text>,
              },
            ]
      }
      selectedId={selectedId()}
      onSelect={select}
      onPositionsChange={
        props.readOnly
          ? undefined
          : (positions) => {
              const next = positions.get("item");
              if (next) setPosition(next);
            }
      }
    />
  );
}
