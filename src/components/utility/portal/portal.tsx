import type { JSX } from "solid-js";
import { createSignal, onMount, Show } from "solid-js";
import { Portal as SolidPortal } from "solid-js/web";
export type PortalProps = {
  container?: HTMLElement | null;
  children: JSX.Element;
};
export function Portal(props: PortalProps) {
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));
  return (
    <Show when={mounted()}>
      <SolidPortal mount={props.container ?? document.body}>
        {props.children}
      </SolidPortal>
    </Show>
  );
}
