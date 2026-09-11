import { Popover as Ark } from "@ark-ui/solid/popover";
import { createEffect, splitProps, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import s from "./popover.module.css";
export type PopoverProps = Omit<
  ComponentProps<typeof Ark.Root>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void;
};
export function Popover(props: PopoverProps) {
  const [local, rest] = splitProps(props, ["onOpenChange"]);
  return (
    <Ark.Root
      positioning={{
        placement: "bottom-start",
        gutter: 6,
      }}
      {...rest}
      onOpenChange={(d) => local.onOpenChange?.(d.open)}
    />
  );
}
export function PopoverTrigger(props: ComponentProps<typeof Ark.Trigger>) {
  return <Ark.Trigger {...props} />;
}
export function PopoverClose(props: ComponentProps<typeof Ark.CloseTrigger>) {
  return <Ark.CloseTrigger {...props} />;
}
export type PopoverContentProps = ComponentProps<typeof Ark.Content> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
};
export function PopoverContent(props: PopoverContentProps) {
  const [local, rest] = splitProps(props, ["class", "sideOffset", "align"]);
  return (
    <Ark.Context>
      {(api) => {
        createEffect(() =>
          api().reposition({
            placement:
              local.align === "end"
                ? "bottom-end"
                : local.align === "center"
                  ? "bottom"
                  : "bottom-start",
            gutter: local.sideOffset ?? 6,
          }),
        );
        return (
          <Portal>
            <Ark.Positioner
              style={{
                "z-index": "var(--z-popover,60)",
              }}
            >
              <Ark.Content
                {...rest}
                class={cn(surface.elevated, s.content, local.class)}
              />
            </Ark.Positioner>
          </Portal>
        );
      }}
    </Ark.Context>
  );
}
