import { mergeProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./mock.module.css";
export type MockProps = {
  /** What is being disclaimed, in the product's own words. */
  note?: string;
  class?: string;
};

/** A visible mark that what is on screen is NOT a record.
 *
 *  Announced, not decorative: somebody who cannot see the badge is exactly the
 *  person most likely to quote a fixture back at you as fact. */
export function Mock(incomingProps: MockProps) {
  const props = mergeProps(
    {
      note: "Sample data. None of this is a record.",
    } as const,
    incomingProps,
  );
  return (
    <span class={cn(s.mock, props.class)} role="note">
      <span class={s.dot} aria-hidden="true" />
      {props.note}
    </span>
  );
}
