import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import { NavLink, type NavLinkProps } from "~/components/navigation";
import { Tooltip, TooltipProvider } from "~/components/overlays";
import { cn } from "~/lib/kernel";
import s from "./navigation-rail.module.css";
export type NavigationRailProps = JSX.HTMLAttributes<HTMLDivElement> & {
  brand?: JSX.Element;
  footer?: JSX.Element;
  label?: string;
};
export function NavigationRail(incomingProps: NavigationRailProps) {
  const componentProps = mergeProps(
    {
      label: "Application sections",
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, [
    "brand",
    "footer",
    "label",
    "children",
    "class",
  ]);
  const _brandSlot = createMemo(() => componentProps.brand);
  const _footerSlot = createMemo(() => componentProps.footer);
  return (
    <TooltipProvider>
      <div class={cn(s.rail, componentProps.class)} {...props}>
        {_brandSlot() && <div class={s.brand}>{_brandSlot()}</div>}
        <nav class={s.items} aria-label={componentProps.label}>
          {componentProps.children}
        </nav>
        {_footerSlot() && <div class={s.footer}>{_footerSlot()}</div>}
      </div>
    </TooltipProvider>
  );
}
export type RailLinkProps = Omit<NavLinkProps, "aria-label"> & {
  label: string;
  description?: string;
};
export function RailLink(componentProps: RailLinkProps) {
  const [, props] = splitProps(componentProps, [
    "label",
    "description",
    "active",
    "class",
  ]);
  return (
    <Tooltip
      side="right"
      content={componentProps.description ?? componentProps.label}
      asChild={(forwarded) => (
        <NavLink
          {...forwarded()}
          class={cn(s.link, componentProps.class)}
          active={componentProps.active}
          aria-current={componentProps.active ? "true" : undefined}
          aria-label={componentProps.label}
          {...props}
        />
      )}
    />
  );
}
