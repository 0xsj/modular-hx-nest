import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { cn } from "~/lib/kernel";
import { PRESENCE_MEANING, PRESENCE_WORD } from "../presence";
import s from "./stat.module.css";
export type StatProps = {
  label: string;
  /** `undefined` means NOBODY MEASURED, and it renders as `–` rather than `0`.
   *  A zero is a measurement; an em-dash is the absence of one, and a screen
   *  that shows 0 for an unmeasured total is asserting something nobody checked. */
  value?: number | string;
  hint?: JSX.Element;
  class?: string;
};
export function Stat(props: StatProps) {
  const _hintSlot = createMemo(() => props.hint);
  const unmeasured = createMemo(() => props.value === undefined);
  return (
    <div class={cn(s.stat, props.class)}>
      <span class={s.label}>{props.label}</span>
      <span
        class={cn(s.value, unmeasured() && s.unmeasured)}
        title={unmeasured() ? PRESENCE_MEANING.unmeasured : undefined}
      >
        {unmeasured() ? PRESENCE_WORD.unmeasured : props.value}
      </span>
      {_hintSlot() ? <span class={s.hint}>{_hintSlot()}</span> : null}
    </div>
  );
}
