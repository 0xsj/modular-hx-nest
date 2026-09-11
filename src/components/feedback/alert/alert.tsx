import type { JSX } from "solid-js";
import { createMemo, mergeProps } from "solid-js";
import { TriangleAlert, VisuallyHidden, X } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./alert.module.css";
import { alertVariants, type AlertVariants } from "./alert.variants";
export type AlertProps = AlertVariants & {
  title?: JSX.Element;
  children: JSX.Element;
  /** What to do about it. */
  action?: JSX.Element;
  /** How this should be ANNOUNCED when it appears — and absent by default,
   *  because most alerts are rendered with the page rather than arriving.
   *
   *      absent      a styled region. Read in document order like any prose.
   *      "polite"    announced when the reader finishes its sentence.
   *      "assertive" interrupts. For something the user must act on NOW.
   *
   *  A live region on a message that was there when the page loaded announces
   *  nothing anyway and costs a role that means "this is new". */
  live?: "polite" | "assertive";
  onDismiss?: () => void;
  dismissLabel?: string;
  class?: string;
};
export function Alert(incomingProps: AlertProps) {
  const props = mergeProps(
    {
      dismissLabel: "Dismiss",
    } as const,
    incomingProps,
  );
  const _titleSlot = createMemo(() => props.title);
  const _actionSlot = createMemo(() => props.action);
  return (
    <div
      class={cn(
        alertVariants({
          tone: props.tone,
        }),
        props.class,
      )}
      role={
        props.live === "assertive"
          ? "alert"
          : props.live === "polite"
            ? "status"
            : undefined
      }
    >
      <div class={s.body}>
        {(props.tone === "crit" || props.tone === "warn") && (
          <VisuallyHidden>
            <TriangleAlert aria-hidden="true" />
            {props.tone === "crit" ? "Error: " : "Warning: "}
          </VisuallyHidden>
        )}
        {_titleSlot() ? <p class={s.title}>{_titleSlot()}</p> : null}
        <div class={s.text}>{props.children}</div>
        {_actionSlot() ? <div class={s.action}>{_actionSlot()}</div> : null}
      </div>
      {props.onDismiss ? (
        <button
          type="button"
          class={s.dismiss}
          onClick={props.onDismiss}
          aria-label={props.dismissLabel}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
