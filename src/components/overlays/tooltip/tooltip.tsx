import { Tooltip as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/kernel";
import s from "./tooltip.module.css";

export type TooltipProps = ComponentProps<typeof Ark.Root>;
export type TooltipTriggerProps = ComponentProps<typeof Ark.Trigger>;

export function Tooltip(props: TooltipProps) {
  return <Ark.Root {...props} />;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <Ark.Trigger {...props} />;
}

export function TooltipContent(props: { class?: string; children: JSX.Element }) {
  const [local] = splitProps(props, ["class", "children"]);
  return (
    <Portal>
      <Ark.Positioner class={s.positioner}>
        {/* No interactive children, ever. A tooltip disappears on blur and on
            pointer-leave, so anything focusable inside it is unreachable —
            see doc.ts. */}
        <Ark.Content class={cn(s.content, local.class)}>{local.children}</Ark.Content>
      </Ark.Positioner>
    </Portal>
  );
}
