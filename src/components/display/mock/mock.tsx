import { Show, type JSX } from "solid-js";
import { VisuallyHidden } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./mock.module.css";

export type MockProps = {
  /** What is being disclaimed, in the product's own words — "sample readings,
   *  not from this site". Defaults to the general statement. */
  note?: string;
  class?: string;
  children: JSX.Element;
};

const DEFAULT_NOTE = "Placeholder content — not real data.";

/** Marks content that is NOT the product's data. Deliberately conspicuous;
 *  see doc.ts. */
export function Mock(props: MockProps) {
  return (
    <div class={cn(s.mock, props.class)} data-mock="">
      {/* Announced first, before the content it qualifies — a disclaimer that
          follows the numbers arrives after they have been believed. */}
      <VisuallyHidden>{props.note ?? DEFAULT_NOTE}</VisuallyHidden>
      <p aria-hidden="true" class={s.tag}>
        <Show when={props.note} fallback="placeholder">{props.note}</Show>
      </p>
      {props.children}
    </div>
  );
}
