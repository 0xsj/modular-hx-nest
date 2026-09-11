import { createSignal, splitProps, untrack, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { toggleVariants, type ToggleVariants } from "./toggle.variants";
export type ToggleProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  ToggleVariants & {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (value: boolean) => void;
  };
export function Toggle(props: ToggleProps) {
  const [local, rest] = splitProps(props, [
    "pressed",
    "defaultPressed",
    "onPressedChange",
    "class",
    "size",
    "onClick",
  ]);
  const [internal, setInternal] = createSignal(
    untrack(() => local.defaultPressed ?? false),
  );
  const pressed = () => local.pressed ?? internal();
  return (
    <button
      {...rest}
      type="button"
      aria-pressed={pressed()}
      data-state={pressed() ? "on" : "off"}
      class={cn(
        toggleVariants({
          size: local.size,
        }),
        local.class,
      )}
      onClick={(event) => {
        const handler = local.onClick;
        if (typeof handler === "function") handler(event);
        else if (handler) handler[0](handler[1], event);
        if (event.defaultPrevented || rest.disabled) return;
        const next = !pressed();
        setInternal(next);
        local.onPressedChange?.(next);
      }}
    />
  );
}
