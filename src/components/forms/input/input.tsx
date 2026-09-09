import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { inputVariants, type InputVariants } from "./input.variants";

type Shared = Omit<InputVariants, "multiline">;

export type InputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> & Shared;

/** A text control, and nothing else. It owns no label, no error and no
 *  description — `Field` owns those and hands this the attributes that connect
 *  them. See `../field/doc.ts`. */
export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["size", "mono", "class"]);
  return (
    <input
      {...rest}
      class={cn(inputVariants({ size: local.size, mono: local.mono }), local.class)}
    />
  );
}

export type TextareaProps = Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & Shared;

/** The same control with a height. Same file because it is the same styling and
 *  the same contract — splitting them would duplicate both and let them drift,
 *  and a caller choosing between them is choosing a shape, not a component. */
export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, ["size", "mono", "class", "rows"]);
  return (
    <textarea
      rows={local.rows ?? 4}
      {...rest}
      class={cn(
        inputVariants({ size: local.size, mono: local.mono, multiline: true }),
        local.class,
      )}
    />
  );
}
