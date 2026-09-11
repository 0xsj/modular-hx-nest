import { mergeProps, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { inputVariants, type InputVariants } from "./input.variants";
type Shared = Omit<InputVariants, "multiline">;
export type InputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "size"
> &
  Shared;

/** A text control, and nothing else. It owns no label, no error and no
 *  description — `Field` owns those and hands this the attributes that connect
 *  them. See `../field/doc.ts`. */
export function Input(componentProps: InputProps) {
  const [, props] = splitProps(componentProps, ["class", "size", "mono"]);
  return (
    <input
      class={cn(
        inputVariants({
          size: componentProps.size,
          mono: componentProps.mono,
        }),
        componentProps.class,
      )}
      {...props}
    />
  );
}
export type TextareaProps = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> &
  Shared;

/** The same control with a height. Same file because it is the same styling and
 *  the same contract — splitting them would duplicate both and let them drift,
 *  and a caller choosing between them is choosing a shape, not a component. */
export function Textarea(incomingProps: TextareaProps) {
  const componentProps = mergeProps(
    {
      rows: 4,
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "class",
    "size",
    "mono",
    "rows",
  ]);
  return (
    <textarea
      rows={componentProps.rows}
      class={cn(
        inputVariants({
          size: componentProps.size,
          mono: componentProps.mono,
          multiline: true,
        }),
        componentProps.class,
      )}
      {...props}
    />
  );
}
