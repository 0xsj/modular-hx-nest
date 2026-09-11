import { Checkbox as Ark } from "@ark-ui/solid/checkbox";
import { createEffect, splitProps, type ComponentProps } from "solid-js";
import { Check, Minus } from "~/components/utility";
import { cn } from "~/lib/kernel";
import {
  bindNativeChoiceReset,
  nativeChoiceStyle,
} from "../_shared/native-choice";
import s from "./checkbox.module.css";
export type CheckedState = boolean | "indeterminate";
export type CheckboxProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onCheckedChange"
> & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  onCheckedChange?: (value: CheckedState) => void;
};
export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "id",
    "onCheckedChange",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-invalid",
  ]);
  return (
    <Ark.Root
      style={{ position: "relative" }}
      {...rest}
      ids={
        local.id
          ? {
              hiddenInput: local.id,
            }
          : undefined
      }
      onCheckedChange={(d) => local.onCheckedChange?.(d.checked)}
      class={s.root}
    >
      <Ark.Control class={cn(s.checkbox, local.class)}>
        <Ark.Indicator class={s.indicator}>
          <Check size={12} stroke-width={3} />
        </Ark.Indicator>
        <Ark.Indicator indeterminate class={s.indicator}>
          <Minus size={12} stroke-width={3} />
        </Ark.Indicator>
      </Ark.Control>
      <Ark.Context>
        {(api) => {
          let input!: HTMLInputElement;
          bindNativeChoiceReset(
            () => input,
            () => ({
              checked: api().checked,
              indeterminate: api().indeterminate,
            }),
          );
          createEffect(() => {
            if (input) input.indeterminate = api().indeterminate;
          });
          return (
            <Ark.HiddenInput
              style={nativeChoiceStyle}
              ref={input}
              aria-label={local["aria-label"]}
              aria-labelledby={local["aria-labelledby"]}
              aria-describedby={local["aria-describedby"]}
              aria-invalid={local["aria-invalid"]}
            />
          );
        }}
      </Ark.Context>
    </Ark.Root>
  );
}
