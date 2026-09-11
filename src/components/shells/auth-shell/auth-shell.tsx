import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { Mark } from "~/components/chrome";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import s from "./auth-shell.module.css";
export type AuthShellProps = {
  /** REQUIRED, and rendered as the page's `h1`.
   *
   *  A sign-in page whose only heading is a wordmark gives a reader arriving by
   *  keyboard or by screen reader nothing to orient on. Making it a prop means
   *  a screen cannot forget, and means the wordmark above stays a lockup rather
   *  than being pressed into service as a heading. */
  title: string;
  description?: string;
  /** Under the card: the link to the other door, usually. */
  footer?: JSX.Element;
  children: JSX.Element;
  /** On the PAGE element, which is the outer one — so a caller framing this
   *  inside something smaller than a viewport can say so. */
  class?: string;
};

/** The frame every unauthenticated screen shares.
 *
 *  It owns the arrangement — centred, one column, a card — and nothing else. No
 *  form, no fields, no submit: those differ per screen and putting them here is
 *  how a shell acquires a `mode` prop and then four of them. */
export function AuthShell(props: AuthShellProps) {
  const _descriptionSlot = createMemo(() => props.description);
  const _footerSlot = createMemo(() => props.footer);
  return (
    <div class={cn(s.page, props.class)}>
      <div class={s.column}>
        <Mark class={s.brand} />

        <div class={cn(surface.elevated, s.card)}>
          <div class={s.head}>
            <h1 class={s.title}>{props.title}</h1>
            {_descriptionSlot() ? (
              <p class={s.description}>{_descriptionSlot()}</p>
            ) : null}
          </div>
          {props.children}
        </div>

        {_footerSlot() ? <div class={s.foot}>{_footerSlot()}</div> : null}
      </div>
    </div>
  );
}
