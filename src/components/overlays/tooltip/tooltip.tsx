import { Tooltip as Ark } from "@ark-ui/solid/tooltip";
import type { ComponentProps, JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { Portal } from "solid-js/web";
import s from "./tooltip.module.css";
const Timing = createContext({
  delay: 500,
});
export type TooltipProviderProps = {
  delayDuration?: number;
  children: JSX.Element;
};
export function TooltipProvider(props: TooltipProviderProps) {
  return (
    <Timing.Provider
      value={{
        get delay() {
          return props.delayDuration ?? 500;
        },
      }}
    >
      {props.children}
    </Timing.Provider>
  );
}
export type TooltipProps = {
  content: JSX.Element;
  side?: "top" | "right" | "bottom" | "left";
  asChild: NonNullable<ComponentProps<typeof Ark.Trigger>["asChild"]>;
};
export function Tooltip(props: TooltipProps) {
  const timing = useContext(Timing);
  return (
    <Ark.Root
      openDelay={timing.delay}
      closeDelay={100}
      positioning={{
        placement: props.side ?? "top",
        gutter: 6,
      }}
    >
      <Ark.Trigger asChild={props.asChild} />
      <Portal>
        <Ark.Positioner
          style={{
            "z-index": "var(--z-tooltip,80)",
          }}
        >
          <Ark.Content class={s.content}>
            {props.content}
            <Ark.Arrow class={s.arrow} />
          </Ark.Content>
        </Ark.Positioner>
      </Portal>
    </Ark.Root>
  );
}
