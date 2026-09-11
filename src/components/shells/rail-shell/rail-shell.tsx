import type { JSX } from "solid-js";
import { createMemo, createSignal, createUniqueId, mergeProps } from "solid-js";
import { Button } from "~/components/forms";
import { PanelLeftClose, PanelLeftOpen } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./rail-shell.module.css";
type SidebarState =
  | {
      sidebarOpen: boolean;
      onSidebarOpenChange: (open: boolean) => void;
      defaultSidebarOpen?: never;
    }
  | {
      sidebarOpen?: never;
      defaultSidebarOpen?: boolean;
      onSidebarOpenChange?: (open: boolean) => void;
    };
export type RailShellProps = SidebarState & {
  rail: JSX.Element;
  sidebar: JSX.Element;
  header?: JSX.Element;
  children: JSX.Element;
  sidebarLabel?: string;
  class?: string;
};
export function RailShell(incomingProps: RailShellProps) {
  const props = mergeProps(
    {
      sidebarLabel: "Section navigation",
      defaultSidebarOpen: true,
    } as const,
    incomingProps,
  );
  const id = createUniqueId();
  const [localOpen, setLocalOpen] = createSignal(props.defaultSidebarOpen);
  const open = createMemo(() => props.sidebarOpen ?? localOpen());
  function toggle() {
    const next = !open();
    if (props.sidebarOpen === undefined) setLocalOpen(next);
    props.onSidebarOpenChange?.(next);
  }
  return (
    <div class={cn(s.shell, props.class)}>
      <div class={s.frame} data-sidebar-open={open() ? "" : undefined}>
        <a href={`#${id}-content`} class={s.skip}>
          Skip to content
        </a>
        <div class={s.rail}>{props.rail}</div>
        <aside
          id={`${id}-sidebar`}
          class={s.sidebar}
          aria-label={props.sidebarLabel}
          hidden={!open()}
        >
          {props.sidebar}
        </aside>
        <header class={s.header}>
          <Button
            intent="ghost"
            size="icon"
            aria-label={
              open() ? "Hide section navigation" : "Show section navigation"
            }
            aria-expanded={open()}
            aria-controls={`${id}-sidebar`}
            onClick={toggle}
          >
            {open() ? (
              <PanelLeftClose size={17} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={17} aria-hidden="true" />
            )}
          </Button>
          <div class={s.headerContent}>{props.header}</div>
        </header>
        <main id={`${id}-content`} tabindex={-1} class={s.main}>
          {props.children}
        </main>
      </div>
    </div>
  );
}
