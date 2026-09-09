import { Show, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./empty.module.css";

export type EmptyProps = {
  /** What is absent, in the product's nouns. "No cameras yet", never
   *  "No data" — see doc.ts. */
  title: string;
  body?: JSX.Element;
  /** The thing to do about it, when there is one. */
  action?: JSX.Element;
  class?: string;
};

/** LOOKED AND FOUND NOTHING. Not "nobody looked" — that is a failure, and it
 *  has its own rendering. */
export function Empty(props: EmptyProps) {
  return (
    <div class={cn(s.empty, props.class)}>
      <p class={s.title}>{props.title}</p>
      <Show when={props.body}>
        <p class={s.body}>{props.body}</p>
      </Show>
      <Show when={props.action}>
        <div class={s.action}>{props.action}</div>
      </Show>
    </div>
  );
}
