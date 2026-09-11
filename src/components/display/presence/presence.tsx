import type { JSX } from "solid-js";
import type { Presence as PresenceValue } from "~/lib/kernel";
import { assertNever, cn } from "~/lib/kernel";
import s from "./presence.module.css";

/** What each state MEANS, in one place.
 *
 *  One definition so a cell, a legend and a screen reader cannot drift apart —
 *  the moment two of them describe "never checked" differently, the distinction
 *  the whole discipline exists for has been lost in the copy rather than in the
 *  data. */
export const PRESENCE_MEANING = {
  found: "found — a source said so",
  empty: "looked, and found nothing",
  unmeasured: "never checked — not the same as nothing",
} as const;

/** The word shown in place of a value. `found` has none: it renders its value. */
export const PRESENCE_WORD = {
  empty: "none",
  unmeasured: "–",
} as const;
export type PresenceProps<T> = {
  of: PresenceValue<T>;
  children: (value: T) => JSX.Element;
  class?: string;
};

/** Three states, rendered — and the reason this is a component rather than a
 *  ternary at each call site.
 *
 *  `value ? x : "–"` collapses *looked and found nothing* into *never checked*
 *  at the last possible moment, after every tier below has been careful to keep
 *  them apart. This makes that collapse impossible: there is no branch to
 *  forget, and each of the two absent states carries its own title so hovering
 *  or reading it says which one it is. */
export function Presence<T>(props: PresenceProps<T>) {
  return (
    <>
      {(() => {
        switch (props.of.state) {
          case "found":
            return <>{props.children(props.of.value)}</>;
          case "empty":
            return (
              <span
                class={cn(s.absent, props.class)}
                title={PRESENCE_MEANING.empty}
              >
                {PRESENCE_WORD.empty}
              </span>
            );
          case "unmeasured":
            return (
              <span
                class={cn(s.unmeasured, props.class)}
                title={PRESENCE_MEANING.unmeasured}
              >
                {PRESENCE_WORD.unmeasured}
              </span>
            );
          default:
            return assertNever(props.of, "presence state");
        }
      })()}
    </>
  );
}
