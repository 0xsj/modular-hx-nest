import { Show, createUniqueId, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./fieldset.module.css";

export type FieldsetProps = Omit<JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>, "title"> & {
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
 *  plain nodes here — there is nothing to hand down. */
export function Fieldset(props: FieldsetProps) {
  const [local, rest] = splitProps(props, ["legend", "hint", "error", "class", "children"]);
  const id = createUniqueId();
  const hintId = () => (local.hint ? `${id}-hint` : undefined);
  const errorId = () => (local.error ? `${id}-error` : undefined);
  const describedBy = () => [errorId(), hintId()].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset
      {...rest}
      class={cn(s.fieldset, local.class)}
      aria-describedby={describedBy()}
      aria-invalid={local.error ? true : undefined}
    >
      <legend class={s.legend}>{local.legend}</legend>
      <Show when={local.hint}>
        <p id={hintId()} class={s.hint}>{local.hint}</p>
      </Show>
      <div class={s.body}>{local.children}</div>
      <Show when={local.error}>
        <p id={errorId()} class={s.error}>{local.error}</p>
      </Show>
    </fieldset>
  );
}
