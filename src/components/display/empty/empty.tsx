import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./empty.module.css";
export type EmptyProps = {
  /** What is absent, said plainly. "No targets yet", not "No data". */
  title: string;
  body?: JSX.Element;
  /** The thing to do about it, when there is one. */
  action?: JSX.Element;
  class?: string;
};

/** Looked, and found nothing — which is an ANSWER and should read like one.
 *
 *  Distinct from a failure surface on purpose: an empty list is a successful
 *  request, and rendering it in error styling teaches people to treat a working
 *  system as broken. */
export function Empty(props: EmptyProps) {
  const _bodySlot = createMemo(() => props.body);
  const _actionSlot = createMemo(() => props.action);
  return (
    <div class={cn(s.empty, props.class)}>
      <p class={s.title}>{props.title}</p>
      {_bodySlot() ? <p class={s.body}>{_bodySlot()}</p> : null}
      {_actionSlot() ? <div class={s.action}>{_actionSlot()}</div> : null}
    </div>
  );
}
