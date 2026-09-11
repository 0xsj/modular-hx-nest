import { ark, type PolymorphicProps } from "@ark-ui/solid/factory";
import { Show, splitProps, type JSX } from "solid-js";
import { LoaderCircle } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./button.module.css";
import { buttonVariants, type ButtonVariants } from "./button.variants";
export type ButtonAsChild = NonNullable<PolymorphicProps<"button">["asChild"]>;
type BaseProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "color"> &
  ButtonVariants & {
    loading?: boolean;
    asChild?: ButtonAsChild;
  };
export type ButtonProps =
  | (BaseProps & {
      size?: Exclude<ButtonVariants["size"], "icon">;
    })
  | (BaseProps & {
      size: "icon";
      "aria-label": string;
    });
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "intent",
    "size",
    "loading",
    "disabled",
    "type",
    "children",
    "asChild",
  ]);
  const inert = () => Boolean(local.disabled || local.loading);
  return (
    <ark.button
      {...rest}
      asChild={local.asChild}
      type={local.asChild ? undefined : (local.type ?? "button")}
      disabled={local.asChild ? undefined : inert()}
      aria-disabled={(local.asChild && inert()) || undefined}
      tabindex={local.asChild && inert() ? -1 : rest.tabindex}
      data-disabled={inert() ? "" : undefined}
      data-loading={local.loading ? "" : undefined}
      aria-busy={local.loading || undefined}
      class={cn(
        buttonVariants({
          intent: local.intent,
          size: local.size,
        }),
        local.class,
      )}
    >
      <Show when={local.loading}>
        <LoaderCircle class={s.spinner} aria-hidden="true" />
      </Show>
      {local.children}
    </ark.button>
  );
}
