import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./progress.module.css";
export type ProgressProps = Omit<
  JSX.ProgressHTMLAttributes<HTMLProgressElement>,
  "value" | "max" | "children"
> & {
  label: string;
  value: number | null;
  max?: number;
};
export function Progress(incomingProps: ProgressProps) {
  const componentProps = mergeProps(
    {
      max: 100,
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "label",
    "value",
    "max",
    "class",
  ]);
  const limit = createMemo(() =>
    Number.isFinite(componentProps.max) && componentProps.max > 0
      ? componentProps.max
      : 100,
  );
  const amount = createMemo(() =>
    componentProps.value === null || !Number.isFinite(componentProps.value)
      ? undefined
      : Math.max(0, Math.min(componentProps.value, limit())),
  );
  return (
    <progress
      class={cn(s.progress, componentProps.class)}
      aria-label={componentProps.label}
      max={limit()}
      value={amount()}
      {...props}
    />
  );
}
