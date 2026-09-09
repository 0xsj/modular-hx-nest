import { Show, createUniqueId, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { Label } from "../label";
import s from "./field.module.css";

/** Exactly the attributes the control must carry. Named AS the attributes they
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

/** Owns the label, the description, the error, and the wiring that connects
 *  them — and hands that wiring to the caller rather than reaching for the
 *  control. See `doc.ts`; the render prop is the whole design. */
export function Field(props: FieldProps) {
  /* POSITIONAL, not allocated. The id is derived from where this component
     sits in the tree, so hydration recomputes the same one on the client
     without it having been transmitted.

     A module-scope counter cannot do that, and the reason is worth stating
     precisely because the obvious one is too mild: the problem is not that it
     restarts, it is that ONE counter serves every request in the server
     process. Two renders in flight interleave, so the ids depend on
     concurrency and match nothing a client counting from zero produces. That
     fails per request and under load — a label silently pointing at another
     field's control, on a page that is correct in development. */
  const id = createUniqueId();
  const hintId = () => (props.hint ? `${id}-hint` : undefined);
  const errorId = () => (props.error ? `${id}-error` : undefined);

  /* Error FIRST: a reader announces them in this order and the error is the
     more urgent. Absent rather than empty when there is neither. */
  const describedBy = () =>
    [errorId(), hintId()].filter(Boolean).join(" ") || undefined;

  /* GETTERS, and the call below runs exactly once.
     Solid does not re-render a component. A value read while BUILDING this
     object is read inside the tracked JSX position the call sits in, so
     changing `error` re-runs the render prop and REPLACES the control instead
     of updating it — measured: a new element, the user's typed text gone and
     focus lost, at the exact moment validation reports a problem.
     Behind getters nothing is read at call time, so the spread at the call
     site subscribes per attribute and the same input simply gains one. */
  const control: FieldControlProps = {
    id,
    get "aria-describedby"() {
      return describedBy();
    },
    /* Absent, never false: `aria-invalid="false"` is a different
       announcement from no attribute at all. */
    get "aria-invalid"() {
      return props.error ? true : undefined;
    },
    get required() {
      return props.required || undefined;
    },
  };

  return (
    <div class={cn(s.field, props.class)}>
      <Label for={id}>
        {props.label}
        {/* Visual only. `required` on the CONTROL is the announcement, and
            hearing "star" after every label is noise. */}
        <Show when={props.required}>
          <span class={s.required} aria-hidden="true">*</span>
        </Show>
      </Label>

      {props.children(control)}

      <Show when={props.error}>
        <p id={errorId()} class={s.error}>{props.error}</p>
      </Show>
      {/* The hint is NOT replaced by the error. "Use at least twelve
          characters" is still true while the field is wrong, and swapping them
          removes the instruction exactly when it is needed. */}
      <Show when={props.hint}>
        <p id={hintId()} class={s.hint}>{props.hint}</p>
      </Show>
    </div>
  );
}
