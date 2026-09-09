import { Show, splitProps, type JSX } from "solid-js";
import { Check, Info, TriangleAlert, X } from "~/components/utility";
import { VisuallyHidden } from "~/components/utility";
import { cn } from "~/lib/kernel";
import { alertVariants, type AlertVariants } from "./alert.variants";
import s from "./alert.module.css";

export type AlertProps = AlertVariants & {
  title?: JSX.Element;
  children: JSX.Element;
  /** What to do about it, when there is something. */
  action?: JSX.Element;
  /** How this is ANNOUNCED when it appears, and absent by default because
   *  most alerts are rendered with the page rather than arriving. See doc.ts —
   *  a live region has to exist before the thing it announces. */
  live?: "polite" | "assertive";
  /** Passed in, never manufactured. No handler, no button. */
  onDismiss?: () => void;
  dismissLabel?: string;
  class?: string;
};

/** The word a reader gets in place of the colour — and only for the two tones
 *  where missing it changes what you do. "Info" and "accent" add nothing a
 *  sentence does not already carry. */
const SPOKEN: Partial<Record<NonNullable<AlertVariants["tone"]>, string>> = {
  warn: "Warning",
  crit: "Error",
};

const GLYPH: Record<NonNullable<AlertVariants["tone"]>, (() => JSX.Element) | null> = {
  neutral: null,
  accent: () => <Check size={15} aria-hidden="true" />,
  info: () => <Info size={15} aria-hidden="true" />,
  warn: () => <TriangleAlert size={15} aria-hidden="true" />,
  crit: () => <TriangleAlert size={15} aria-hidden="true" />,
};

export function Alert(props: AlertProps) {
  const [local, variants] = splitProps(props, [
    "title", "children", "action", "live", "onDismiss", "dismissLabel", "class",
  ]);
  const tone = () => variants.tone ?? "neutral";
  /* role, not aria-live: `alert` and `status` each imply their politeness AND
     `aria-atomic`, so the region is re-read whole rather than as the diff. */
  const role = () =>
    local.live === "assertive" ? "alert" : local.live === "polite" ? "status" : undefined;

  return (
    <div class={cn(alertVariants(variants), local.class)} role={role()}>
      <Show when={GLYPH[tone()]}>
        {(glyph) => <span class={s.glyph}>{glyph()()}</span>}
      </Show>

      <div class={s.content}>
        {/* Inside the region, so it is announced WITH the message rather than
            as a separate stray word. */}
        <Show when={SPOKEN[tone()]}>
          {(word) => <VisuallyHidden>{word()}:</VisuallyHidden>}
        </Show>
        <Show when={local.title}>
          <p class={s.title}>{local.title}</p>
        </Show>
        <div class={s.body}>{local.children}</div>
        <Show when={local.action}>
          <div class={s.action}>{local.action}</div>
        </Show>
      </div>

      <Show when={local.onDismiss}>
        {(dismiss) => (
          <button
            type="button"
            class={s.dismiss}
            /* An icon-only control with no name is an unlabelled button. */
            aria-label={local.dismissLabel ?? "Dismiss"}
            onClick={() => dismiss()()}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </Show>
    </div>
  );
}
