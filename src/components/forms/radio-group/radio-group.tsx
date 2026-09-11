import { RadioGroup as Ark } from "@ark-ui/solid/radio-group";
import {
  createContext,
  createUniqueId,
  onCleanup,
  splitProps,
  untrack,
  useContext,
  type ComponentProps,
} from "solid-js";
import { cn } from "~/lib/kernel";
import {
  bindNativeChoiceReset,
  nativeChoiceStyle,
} from "../_shared/native-choice";
import s from "./radio-group.module.css";
// External Field labels and the behavior engine must point to the same native
// input. Register stable field IDs before Ark constructs each item.
const InputIds = createContext<Map<string, string>>();
export type RadioGroupProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onValueChange"
> & { onValueChange?: (value: string) => void };
export function RadioGroup(props: RadioGroupProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "onValueChange",
    "id",
    "ids",
  ]);
  const generated = createUniqueId(),
    inputs = new Map<string, string>();
  return (
    <InputIds.Provider value={inputs}>
      <Ark.Root
        {...rest}
        id={local.id ?? generated}
        ids={{
          ...local.ids,
          itemHiddenInput: (value) =>
            inputs.get(value) ??
            local.ids?.itemHiddenInput?.(value) ??
            `radio-group:${local.id ?? generated}:radio:input:${value}`,
        }}
        class={cn(s.group, local.class)}
        onValueChange={(d) => {
          if (d.value != null) local.onValueChange?.(d.value);
        }}
      />
    </InputIds.Provider>
  );
}
export type RadioProps = ComponentProps<typeof Ark.Item> & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};
export function Radio(props: RadioProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "id",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
  ]);
  const inputs = useContext(InputIds);
  const registration = untrack(() => ({ value: props.value, id: local.id }));
  if (registration.id) {
    inputs?.set(registration.value, registration.id);
    onCleanup(() => {
      if (inputs?.get(registration.value) === registration.id)
        inputs?.delete(registration.value);
    });
  }
  return (
    <Ark.Item {...rest} style={{ position: "relative" }} class={s.item}>
      <Ark.ItemControl class={cn(s.radio, local.class)}>
        <span class={s.indicator} />
      </Ark.ItemControl>
      <Ark.ItemContext>
        {(item) => {
          let input: HTMLInputElement | undefined;
          bindNativeChoiceReset(
            () => input,
            () => ({ checked: item().checked }),
          );
          return (
            <Ark.ItemHiddenInput
              ref={input}
              style={nativeChoiceStyle}
              aria-label={local["aria-label"]}
              aria-labelledby={local["aria-labelledby"]}
              aria-describedby={local["aria-describedby"]}
            />
          );
        }}
      </Ark.ItemContext>
    </Ark.Item>
  );
}
