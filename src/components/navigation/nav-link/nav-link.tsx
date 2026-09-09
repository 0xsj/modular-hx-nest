import { A } from "@solidjs/router";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./nav-link.module.css";

export type NavLinkProps = Omit<
  ComponentProps<typeof A>,
  /* Not the caller's. They select this component's own hashed classes, and a
     caller who overrides them detaches the styling from the active state. */
  "activeClass" | "inactiveClass"
>;

/** A link that knows whether it is the current route.
 *
 *  The router decides both, and decides them DIFFERENTLY on purpose — see
 *  doc.ts. This adds the styling and nothing else. */
export function NavLink(props: NavLinkProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <A
      {...rest}
      class={cn(s.link, local.class)}
      /* Explicit, because the defaults are the GLOBAL class names "active"
         and "inactive" — two unscoped names in a codebase that has no other
         global classes, free to collide with anything. */
      activeClass={s.active}
      inactiveClass={s.inactive}
    />
  );
}
