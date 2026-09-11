import { createSignal } from "solid-js";
import type { Cell, GraphNode } from "~/components/charts";
import {
  CircularNetwork,
  Matrix,
  NothingKey,
  categorical,
} from "~/components/charts";
import { Button } from "~/components/forms";
import { Text } from "~/components/typography";
const nodes: readonly GraphNode[] = [
  {
    id: "workspace",
    label: "Workspace",
    group: "Core",
    fill: categorical(0),
    size: 9,
  },
  {
    id: "projects",
    label: "Projects",
    group: "Work",
    fill: categorical(1),
    shape: "square",
  },
  {
    id: "members",
    label: "Members",
    group: "People",
    fill: categorical(2),
    shape: "diamond",
  },
  {
    id: "reports",
    label: "Reports",
    group: "Work",
    fill: categorical(1),
    shape: "square",
  },
  {
    id: "billing",
    label: "Billing",
    group: "Core",
    fill: categorical(0),
  },
];
const edges = [
  {
    from: "workspace",
    to: "projects",
  },
  {
    from: "workspace",
    to: "members",
  },
  {
    from: "projects",
    to: "reports",
  },
  {
    from: "workspace",
    to: "billing",
  },
];
export function NetworkSelectionDemo() {
  const [selected, setSelected] = createSignal<string | null>(null);
  return (
    <>
      <Text as="div" role="status">
        {selected()
          ? `Selected: ${nodes.find((node) => node.id === selected())?.label}`
          : "Select a node to inspect its connections."}
      </Text>
      <CircularNetwork
        title="Workspace relationships"
        nodes={nodes}
        edges={edges}
        width={520}
        height={320}
        selected={selected()}
        onSelect={setSelected}
      />
      <Button
        size="sm"
        disabled={!selected()}
        onClick={() => setSelected(null)}
      >
        Clear node selection
      </Button>
    </>
  );
}
const rows = ["Atlas", "Beacon", "Canvas"];
const columns = ["Checks", "Members", "Exports"];
const cells: readonly Cell[] = [
  {
    state: "value",
    value: 82,
  },
  {
    state: "absent",
  },
  {
    state: "unattempted",
  },
  {
    state: "value",
    value: 100,
  },
  {
    state: "value",
    value: 40,
  },
  {
    state: "na",
  },
  {
    state: "value",
    value: 0,
  },
  {
    state: "unattempted",
  },
  {
    state: "value",
    value: 62,
  },
];
const cell = (row: string, column: string) =>
  cells[rows.indexOf(row) * columns.length + columns.indexOf(column)];
export function MatrixSelectionDemo() {
  const [selected, setSelected] = createSignal<string | null>(null);
  return (
    <>
      <Text as="div" role="status">
        {(() => {
          const _selectedSnapshot = selected();
          return _selectedSnapshot
            ? `Selected: ${_selectedSnapshot}`
            : "Choose a workspace measurement.";
        })()}
      </Text>
      <Matrix
        title="Workspace coverage"
        rows={rows}
        columns={columns}
        cell={cell}
        width={480}
        height={300}
        extent={100}
        onSelect={(row, column) => setSelected(`${row} · ${column}`)}
      />
      <NothingKey />
    </>
  );
}
