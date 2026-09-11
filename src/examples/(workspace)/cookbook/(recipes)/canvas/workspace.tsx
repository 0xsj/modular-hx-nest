import { createMemo, createSignal, Show } from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionItem,
  DescriptionList,
} from "~/components/display";
import { Button, Field, Input } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { Canvas } from "~/components/workspaces";
import s from "./workspace.module.css";
const INITIAL = [
  {
    id: "sources",
    label: "Collect sources",
    detail: "Bring the useful inputs into one place.",
    position: {
      x: 0,
      y: 100,
    },
  },
  {
    id: "organize",
    label: "Find the shape",
    detail: "Connect the pieces and look for a pattern.",
    position: {
      x: 310,
      y: 0,
    },
  },
  {
    id: "review",
    label: "Review together",
    detail: "Leave space for another perspective.",
    position: {
      x: 310,
      y: 240,
    },
  },
  {
    id: "share",
    label: "Share the result",
    detail: "Turn the arrangement into a useful next step.",
    position: {
      x: 620,
      y: 100,
    },
  },
];
const EDGES = [
  {
    id: "a",
    source: "sources",
    target: "organize",
  },
  {
    id: "b",
    source: "sources",
    target: "review",
  },
  {
    id: "c",
    source: "organize",
    target: "share",
  },
  {
    id: "d",
    source: "review",
    target: "share",
  },
];
export function CanvasWorkspace() {
  const [items, setItems] = createSignal(INITIAL);
  const [selectedId, select] = createSignal<string | null>(null);
  const [editable, setEditable] = createSignal(true);
  const [nextId, setNextId] = createSignal(1);
  const selected = createMemo(() =>
    items().find((item) => item.id === selectedId()),
  );
  return (
    <Flex direction="column" gap={7}>
      <Flex justify="space-between" align="center" gap={5} wrap>
        <Text size="sm" tone="muted">
          {items().length} items · freeform example · changes last for this
          visit
        </Text>
        <Flex gap={4} wrap>
          <Button
            disabled={!editable()}
            onClick={() => {
              const id = `note-${nextId()}`;
              setNextId((value) => value + 1);
              setItems((items) => [
                ...items,
                {
                  id,
                  label: "New idea",
                  detail: "Select this item to give it a name.",
                  position: {
                    x: ((nextId() - 1) % 3) * 280,
                    y: 460 + Math.floor((nextId() - 1) / 3) * 180,
                  },
                },
              ]);
              select(id);
            }}
          >
            Add item
          </Button>
          <Button onClick={() => setEditable((value) => !value)}>
            {editable() ? "Lock positions" : "Unlock positions"}
          </Button>
          <Button
            onClick={() => {
              setItems(INITIAL);
              select(null);
            }}
          >
            Reset canvas
          </Button>
        </Flex>
      </Flex>
      <div class={s.workspace}>
        <Canvas
          label="Workflow canvas"
          nodes={items().map((item) => ({
            ...item,
            content: () => (
              <Flex direction="column" gap={5}>
                <Badge glyph="○">
                  {item.id.startsWith("note") ? "Idea" : "Step"}
                </Badge>
                <Text weight="strong">{item.label}</Text>
                <Text size="sm" tone="muted">
                  {item.detail}
                </Text>
              </Flex>
            ),
          }))}
          edges={EDGES}
          selectedId={selectedId()}
          onSelect={select}
          onPositionsChange={
            editable()
              ? (positions) =>
                  setItems((items) =>
                    items.map((item) =>
                      positions.has(item.id)
                        ? {
                            ...item,
                            position: positions.get(item.id)!,
                          }
                        : item,
                    ),
                  )
              : undefined
          }
        />
        <Card class={s.inspector}>
          <CardHeader>
            <CardTitle level={2}>Item details</CardTitle>
          </CardHeader>
          <CardBody>
            <Show
              when={selected()}
              fallback={
                <Text tone="muted">
                  Select an item to inspect or rename it. Pan the canvas to
                  explore, and use the controls to zoom or fit everything into
                  view.
                </Text>
              }
            >
              {(_selection) => (
                <Flex direction="column" gap={7}>
                  <Field label="Item name">
                    {(control) => (
                      <Input
                        {...control}
                        value={selected()?.label ?? ""}
                        maxLength={80}
                        onInput={(event) =>
                          setItems((items) =>
                            items.map((item) =>
                              item.id === selected()?.id
                                ? {
                                    ...item,
                                    label: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    )}
                  </Field>
                  <DescriptionList>
                    <DescriptionItem term="Position">
                      {Math.round(selected()!.position.x)},{" "}
                      {Math.round(selected()!.position.y)}
                    </DescriptionItem>
                    <DescriptionItem term="Movement">
                      {editable() ? "Unlocked" : "Locked"}
                    </DescriptionItem>
                  </DescriptionList>
                  <Text size="sm" tone="muted">
                    Select a canvas item, then use arrow keys to move it. Shift
                    moves in larger steps.
                  </Text>
                </Flex>
              )}
            </Show>
          </CardBody>
        </Card>
      </div>
    </Flex>
  );
}
