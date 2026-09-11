import { Slider as Ark } from "@ark-ui/solid/slider";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./slider.module.css";
export type SliderProps = Omit<
  ComponentProps<typeof Ark.Root>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onValueChangeEnd"
  | "children"
  | "orientation"
> & {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
};
export function Slider(props: SliderProps) {
  const [local, rest] = splitProps(props, [
    "label",
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommit",
    "class",
  ]);
  return (
    <Ark.Root
      {...rest}
      value={local.value === undefined ? undefined : [local.value]}
      defaultValue={[local.defaultValue ?? props.min ?? 0]}
      onValueChange={(d) => local.onValueChange?.(d.value[0])}
      onValueChangeEnd={(d) => local.onValueCommit?.(d.value[0])}
      class={cn(s.root, local.class)}
    >
      <Ark.Control>
        <Ark.Track class={s.track}>
          <Ark.Range class={s.range} />
        </Ark.Track>
        <Ark.Thumb index={0} class={s.thumb} aria-label={local.label}>
          <Ark.HiddenInput />
        </Ark.Thumb>
      </Ark.Control>
    </Ark.Root>
  );
}
