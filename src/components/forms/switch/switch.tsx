import { Switch as Ark } from "@ark-ui/solid/switch";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import {
  bindNativeChoiceReset,
  nativeChoiceStyle,
} from "../_shared/native-choice";
import s from "./switch.module.css";
export type SwitchProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onCheckedChange"
> & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onCheckedChange?: (value: boolean) => void;
};
export function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "id",
    "onCheckedChange",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
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
      <Ark.Control class={cn(s.switch, local.class)}>
        <Ark.Thumb class={s.thumb} />
      </Ark.Control>
      <Ark.Context>
        {(api) => {
          let input: HTMLInputElement | undefined;
          bindNativeChoiceReset(
            () => input,
            () => ({ checked: api().checked }),
          );
          return (
            <Ark.HiddenInput
              ref={input}
              style={nativeChoiceStyle}
              role="switch"
              aria-label={local["aria-label"]}
              aria-labelledby={local["aria-labelledby"]}
              aria-describedby={local["aria-describedby"]}
            />
          );
        }}
      </Ark.Context>
    </Ark.Root>
  );
}
