import { Match, Switch, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import type { Failure, Presence as PresenceValue } from "~/lib/kernel";
import s from "./presence.module.css";

export type { PresenceValue };

export type PresenceProps<T, E extends Failure = Failure> = {
  of: PresenceValue<T, E>;
  /** The found case. A function, so `value` is narrowed to T and a caller
   *  cannot reach it in the other two branches. */
  children: (value: T) => JSX.Element;
  /** REQUIRED. What "found nothing" says on THIS screen, in its own nouns —
   *  see doc.ts for why there is no default. */
  empty: JSX.Element;
  /** Nobody measured. Defaults to a statement that says exactly that; the
   *  failure is passed for a caller that can say something more useful. */
  unmeasured?: (failure: E) => JSX.Element;
  class?: string;
};

/** Renders all three states of a measurement, and makes leaving one out a
 *  compile error rather than an omission. */
export function Presence<T, E extends Failure = Failure>(props: PresenceProps<T, E>) {
  /* The ternary is what does the narrowing. `when` takes the narrowed value
     rather than a boolean, and the callback child receives it as an accessor —
     so there is no cast anywhere, and a branch cannot reach a field its state
     does not have. */
  return (
    <Switch>
      <Match when={props.of.state === "found" ? props.of : undefined}>
        {(found) => props.children(found().value)}
      </Match>
      <Match when={props.of.state === "empty"}>
        <div class={cn(s.state, props.class)}>{props.empty}</div>
      </Match>
      <Match when={props.of.state === "unmeasured" ? props.of : undefined}>
        {(nobody) => (
          <div class={cn(s.state, s.unmeasured, props.class)}>
            {props.unmeasured
              ? props.unmeasured(nobody().failure)
              : /* NOT the failure's message — that is diagnostic, written for
                   whoever reads the logs, in someone else's voice. */
                "This could not be measured."}
          </div>
        )}
      </Match>
    </Switch>
  );
}
