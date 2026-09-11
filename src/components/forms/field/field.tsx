import type { JSX } from "solid-js";
import { createMemo, createUniqueId } from "solid-js";
import { cn } from "~/lib/kernel";
import { Label } from "../label";
import s from "./field.module.css";

/** Exactly the attributes the control must carry. Named as the attributes they
 *  become, so a caller spreads them and is done. */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: true;
};
export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  class?: string;
  children: (control: FieldControlProps) => JSX.Element;
};
export function Field(props: FieldProps) {
  const _hintSlot = createMemo(() => props.hint);
  // Stable across a server render and its hydration, and unique per instance.
  const id = createUniqueId();
  const hintId = createMemo(() => (_hintSlot() ? `${id}-hint` : undefined));
  const errorId = createMemo(() => (props.error ? `${id}-error` : undefined));

  // Error FIRST: a reader announces them in this order and the error is the
  // more urgent. Absent rather than empty when there is neither.
  const describedBy = createMemo(
    () => [errorId(), hintId()].filter(Boolean).join(" ") || undefined,
  );
  return (
    <div class={cn(s.field, props.class)}>
      <Label for={id}>
        {props.label}
        {/* The mark is visual only. `required` on the control is the
            announcement, and hearing "star" after every label is noise. */}
        {props.required ? (
          <span class={s.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {props.children({
        id,
        get "aria-describedby"() {
          return describedBy();
        },
        // Absent, never false: `aria-invalid="false"` is a different
        // announcement from no attribute at all.
        get "aria-invalid"() {
          return props.error ? (true as const) : undefined;
        },
        get required() {
          return props.required ? (true as const) : undefined;
        },
      })}

      {props.error ? (
        <p id={errorId()} class={s.error}>
          {props.error}
        </p>
      ) : null}
      {_hintSlot() ? (
        <p id={hintId()} class={s.hint}>
          {_hintSlot()}
        </p>
      ) : null}
    </div>
  );
}
