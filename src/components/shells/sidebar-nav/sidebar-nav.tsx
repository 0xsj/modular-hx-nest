import type { JSX } from "solid-js";
import { For, mergeProps } from "solid-js";
import { NavLink } from "~/components/navigation";
import type { LucideIcon } from "~/components/utility";
import s from "./sidebar-nav.module.css";
export type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Section landing pages should not also be current on every child page. */
  exact?: boolean;
};
export type NavGroup = {
  /** Announced before the links in it, so a reader knows which part of the app
   *  they are moving inside. Omit for a single ungrouped list. */
  label?: string;
  items: readonly NavItem[];
};
export type SidebarNavProps = {
  groups: readonly NavGroup[];
  /** The path the reader is already on.
   *
   *  A PROP, for the reason `NavLink` gives: reading the current route needs a
   *  router, and the router is the one thing that differs between this template
   *  and its siblings. The caller is framework-specific anyway; this stays
   *  portable. */
  current?: string;
  /** Announced before the whole thing. Two navigations on a page that are both
   *  called "navigation" are two things a reader cannot tell apart. */
  label?: string;
  /** Supply the framework's link locally in its client binding. */
  renderLink?: (
    item: NavItem,
    content: JSX.Element,
    props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  ) => JSX.Element;
};

/** A link is current if it IS the path, or if the path is inside it — so a
 *  detail route still marks the section it belongs to. `/` is exempt, or it
 *  would be current everywhere. */
const isCurrent = (href: string, current?: string): boolean => {
  if (!current) return false;
  if (href === current) return true;
  return href !== "/" && current.startsWith(`${href}/`);
};

/** The sidebar's links, grouped.
 *
 *  A `<nav>` per shell, not per group: nested landmarks are a reader's problem,
 *  not a structure. Groups are headed lists inside the one landmark. */
export function SidebarNav(incomingProps: SidebarNavProps) {
  const props = mergeProps(
    {
      label: "Sections",
    } as const,
    incomingProps,
  );
  return (
    <nav aria-label={props.label} class={s.nav}>
      {
        <For each={props.groups}>
          {(group) => (
            <div class={s.group}>
              {group.label ? (
                <div class={s.groupLabel}>{group.label}</div>
              ) : null}
              <For each={group.items}>
                {(item) => {
                  const { href, label: text, icon: Icon, exact } = item;
                  const content = (
                    <>
                      {Icon ? (
                        <Icon size={15} class={s.icon} aria-hidden="true" />
                      ) : null}
                      {text}
                    </>
                  );
                  return (
                    <NavLink
                      href={href}
                      asChild={
                        props.renderLink
                          ? (forwarded) =>
                              props.renderLink!(item, content, forwarded())
                          : undefined
                      }
                      active={
                        exact
                          ? href === props.current
                          : isCurrent(href, props.current)
                      }
                      class={s.item}
                    >
                      {content}
                    </NavLink>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      }
    </nav>
  );
}
