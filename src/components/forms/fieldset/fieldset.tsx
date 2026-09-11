import { createMemo, createUniqueId, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./fieldset.module.css";
export type FieldsetProps = Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "title"
> & {
  /** Names the SET. Rendered as a `<legend>`, the one element announced before
   *  every control inside the group. */
  legend: JSX.Element;
  hint?: JSX.Element;
  error?: string;
  children: JSX.Element;
};

/** A group of controls that share one question.
 *
 *  The counterpart to `Field`, and the difference is where the wiring goes: a
 *  single control receives it, a GROUP keeps it on the container. Children are
 *  therefore plain nodes here — there is nothing to hand down. */
export function Fieldset(componentProps: FieldsetProps) {
  const [, props] = splitProps(componentProps, [
    "legend",
    "hint",
    "error",
    "class",
    "children",
  ]);
  const _hintSlot = createMemo(() => componentProps.hint);
  const id = createUniqueId();
  const hintId = createMemo(() => (_hintSlot() ? `${id}-hint` : undefined));
  const errorId = createMemo(() =>
    componentProps.error ? `${id}-error` : undefined,
  );
  const describedBy = createMemo(
    () => [errorId(), hintId()].filter(Boolean).join(" ") || undefined,
  );
  return (
    <fieldset
      class={cn(s.fieldset, componentProps.class)}
      aria-describedby={describedBy()}
      aria-invalid={componentProps.error ? true : undefined}
      {...props}
    >
      <legend class={s.legend}>{componentProps.legend}</legend>
      {_hintSlot() ? (
        <p id={hintId()} class={s.hint}>
          {_hintSlot()}
        </p>
      ) : null}
      <div class={s.body}>{componentProps.children}</div>
      {componentProps.error ? (
        <p id={errorId()} class={s.error}>
          {componentProps.error}
        </p>
      ) : null}
    </fieldset>
  );
}
