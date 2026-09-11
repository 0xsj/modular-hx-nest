import { createSignal, For } from "solid-js";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/display";
import {
  Checkbox,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/forms";
import { Flex } from "~/components/layout";
import type {
  ItemReadMode,
  ItemSaveMode,
  ItemWorkflow,
} from "~/lib/root/item-workflow";
import s from "./items.module.css";
export function Scenarios(props: { root: ItemWorkflow }) {
  const [read, setRead] = createSignal<ItemReadMode>("success"),
    [save, setSave] = createSignal<ItemSaveMode>("success");
  const [check, setCheck] = createSignal(false);
  const reads: Array<[ItemReadMode, string]> = [
    ["success", "Successful read"],
    ["unavailable", "Read unavailable"],
    ["malformed", "Malformed response"],
  ];
  const saves: Array<[ItemSaveMode, string]> = [
    ["success", "Save successfully"],
    ["refused", "Server refuses the name"],
    ["conflict", "Item changes elsewhere"],
    ["lost-response", "Save commits, response is lost"],
    ["not-delivered", "Request is not delivered"],
    ["held", "Hold the save response"],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Try the failure paths</CardTitle>
        <CardDescription>
          These controls affect subsequent demo requests. They never change your
          application’s backend.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <Flex gap={5} wrap>
          <div class={s.choice}>
            <Field label="Item read behavior">
              {(control) => (
                <Select
                  value={read()}
                  onValueChange={(value) => {
                    const mode = reads.find(([mode]) => mode === value)?.[0];
                    if (mode) {
                      setRead(mode);
                      props.root.setReadMode(mode);
                    }
                  }}
                  items={[
                    ...reads.map(([value, label]) => ({
                      value: value,
                      label: label,
                    })),
                  ]}
                >
                  <SelectTrigger {...control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <For each={reads}>
                      {([value, label]) => (
                        <SelectItem value={value}>{label}</SelectItem>
                      )}
                    </For>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          <div class={s.choice}>
            <Field label="Item save behavior">
              {(control) => (
                <Select
                  value={save()}
                  onValueChange={(value) => {
                    const mode = saves.find(([mode]) => mode === value)?.[0];
                    if (mode) {
                      setSave(mode);
                      props.root.setSaveMode(mode);
                    }
                  }}
                  items={[
                    ...saves.map(([value, label]) => ({
                      value: value,
                      label: label,
                    })),
                  ]}
                >
                  <SelectTrigger {...control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <For each={saves}>
                      {([value, label]) => (
                        <SelectItem value={value}>{label}</SelectItem>
                      )}
                    </For>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Make receipt checks fail">
            {(control) => (
              <Checkbox
                {...control}
                checked={check()}
                onCheckedChange={(value) => {
                  setCheck(value === true);
                  props.root.setChecksFail(value === true);
                }}
              />
            )}
          </Field>
        </Flex>
      </CardBody>
    </Card>
  );
}
