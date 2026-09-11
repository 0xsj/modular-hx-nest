import { ChoicePicker, type MultiChoiceProps } from "../combobox/combobox";
export type MultiSelectProps = MultiChoiceProps;
export function MultiSelect(props: MultiSelectProps) {
  return <ChoicePicker {...props} mode="multiple" />;
}
