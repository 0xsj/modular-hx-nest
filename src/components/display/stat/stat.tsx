import { Show, type JSX } from "solid-js";
import { VisuallyHidden } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./stat.module.css";

/** The mark for a value nobody measured. An en dash, not a hyphen and not a
 *  minus: a hyphen is a word-joiner and a minus belongs to a number. */
export const UNMEASURED = "–";

export type StatProps = {
  label: string;
  /** `undefined` means NOBODY MEASURED, and renders as an en dash rather than
   *  as `0`. A zero is a measurement. */
  value?: number | string;
  hint?: JSX.Element;
  class?: string;
};

export function Stat(props: StatProps) {
  const measured = () => props.value !== undefined && props.value !== null;
  return (
    <div class={cn(s.stat, props.class)}>
      <span class={s.label}>{props.label}</span>
      <Show
        when={measured()}
        fallback={
          <span class={cn(s.value, s.unmeasured)}>
            {/* The dash is decoration; a reader that announces it says
                "dash", or says nothing at all. The words carry the fact. */}
            <span aria-hidden="true">{UNMEASURED}</span>
            <VisuallyHidden>not measured</VisuallyHidden>
          </span>
        }
      >
        <span class={s.value}>{props.value}</span>
      </Show>
      <Show when={props.hint}>
        <span class={s.hint}>{props.hint}</span>
      </Show>
    </div>
  );
}
