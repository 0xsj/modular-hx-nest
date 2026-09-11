import { RadioGroup as Ark } from "@ark-ui/solid/radio-group";
import { For } from "solid-js";
import { cn } from "~/lib/kernel";
import { nativeChoiceStyle } from "../forms/_shared/native-choice";
import s from "./segmented.module.css";
export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};
export type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  class?: string;
};
export function Segmented<T extends string>(props: SegmentedProps<T>) {
  return (
    <Ark.Root
      class={cn(s.group, props.class)}
      aria-label={props.label}
      value={props.value}
      onValueChange={(d) => {
        const option = props.options.find((o) => o.value === d.value);
        if (option) props.onChange(option.value);
      }}
      orientation="horizontal"
    >
      <For each={props.options}>
        {(option) => (
          <Ark.Item
            style={{ position: "relative" }}
            value={option.value}
            class={s.item}
          >
            <Ark.ItemText>{option.label}</Ark.ItemText>
            <Ark.ItemHiddenInput style={nativeChoiceStyle} />
          </Ark.Item>
        )}
      </For>
    </Ark.Root>
  );
}
