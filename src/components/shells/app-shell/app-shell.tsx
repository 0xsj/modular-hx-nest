import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { Mark } from "~/components/chrome";
import { cn } from "~/lib/kernel";
import s from "./app-shell.module.css";
export type AppShellProps = {
  /** The sidebar. A SLOT rather than a list of items, because the shell has no
   *  opinion about what navigation is — see `SidebarNav`, which does. */
  nav: JSX.Element;
  /** The header's trailing end: the preference toggles, an account menu. */
  actions?: JSX.Element;
  /** Replaces the wordmark, for a product that has its own. */
  brand?: JSX.Element;
  children: JSX.Element;
  class?: string;
};

/** Header, rail, main — and nothing about what goes in them.
 *
 *  # Slots, not configuration
 *
 *  Every part a product will want to change is a `ReactNode`. A shell that took
 *  `navItems`, `userName` and `showSearch` would be a bet that those are the
 *  only things that vary, and the bet is lost the first time one item needs a
 *  badge.
 *
 *  # `<main>` is here and nowhere else
 *
 *  One per page, and it is the target of a skip link and the landmark a reader
 *  jumps to. A screen that renders its own inside this one has two, and the
 *  jump stops meaning anything. */
export function AppShell(props: AppShellProps) {
  const _actionsSlot = createMemo(() => props.actions);
  return (
    <div class={cn(s.shell, props.class)}>
      <header class={s.header}>
        {props.brand ?? <Mark />}
        {_actionsSlot() ? <div class={s.actions}>{_actionsSlot()}</div> : null}
      </header>

      <div class={s.body}>
        <aside class={s.rail}>{props.nav}</aside>
        <main class={s.main}>{props.children}</main>
      </div>
    </div>
  );
}
