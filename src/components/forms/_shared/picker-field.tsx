import { createMemo } from "solid-js";
import field from "./picker.module.css";
export type PickerFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  class?: string;
};
export function PickerMessages(props: {
  id: string;
  hint?: string;
  error?: string | null;
}) {
  const _hintSlot = createMemo(() => props.hint);
  return (
    <>
      {props.error && (
        <p id={`${props.id}-error`} class={field.error}>
          {props.error}
        </p>
      )}
      {_hintSlot() && (
        <p id={`${props.id}-hint`} class={field.hint}>
          {_hintSlot()}
        </p>
      )}
    </>
  );
}
