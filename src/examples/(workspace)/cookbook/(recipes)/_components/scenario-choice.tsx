import { For } from "solid-js";
import {
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/forms";
import s from "./recipe.module.css";

/** Recipe control composition; choices stay with the scenario that owns them. */
export function ScenarioChoice<T extends string>(props: {
  label: string;
  value: T;
  options: readonly {
    value: NoInfer<T>;
    label: string;
  }[];
  onChange(value: NoInfer<T>): void;
}) {
  return (
    <div class={s.choice}>
      <Field label={props.label}>
        {(control) => (
          <Select
            value={props.value}
            onValueChange={(raw) => {
              const choice = props.options.find(
                (option) => option.value === raw,
              );
              if (choice) props.onChange?.(choice.value);
            }}
            items={[
              ...props.options.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
          >
            <SelectTrigger {...control}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <For each={props.options}>
                {(option) => (
                  <SelectItem value={option.value}>{option.label}</SelectItem>
                )}
              </For>
            </SelectContent>
          </Select>
        )}
      </Field>
    </div>
  );
}
