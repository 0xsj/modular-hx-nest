import { ark, type PolymorphicProps } from "@ark-ui/solid";
import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import { buttonVariants, type ButtonSize, type ButtonVariants } from "./button.variants";

/** Ark's shape, taken FROM Ark rather than restated. The caller receives a
 *  function, calls it, and spreads the result onto their own element; nothing
 *  is cloned and nothing is inspected — see doc.ts §4.1.
 *
 *  Declaring this by hand is what the first version did, and the hand-written
 *  signature `(props: () => Record<string, unknown>) => JSX.Element` does not
 *  match: the argument Ark passes is `(userProps?) => JSX.HTMLAttributes`, and
 *  a parameter type is contravariant, so the two are not assignable. Aliasing
 *  Ark's own type cannot drift when Ark changes it. */
export type ButtonAsChild = NonNullable<PolymorphicProps<"button">["asChild"]>;

type BaseProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "color"> &
  ButtonVariants & {
    loading?: boolean;
    asChild?: ButtonAsChild;
  };

/** A union rather than one object. `size="icon"` renders no text, so the icon
 *  branch demands an accessible name and the compiler enforces it. */
export type ButtonProps =
  | (BaseProps & { size?: Exclude<ButtonSize, "icon"> })
  | (BaseProps & { size: "icon"; "aria-label": string });

export function Button(props: ButtonProps) {
  /* NOT destructured. Solid's props are a proxy and `const { intent } = props`
     reads once and never updates — silently, with no error. doc.ts §4.5. */
  const [local, rest] = splitProps(props as BaseProps, [
    "intent",
    "size",
    "loading",
    "disabled",
    "type",
    "class",
    "asChild",
    "children",
  ]);

  /* One state, two names. Every rule below keys off this rather than off
     `disabled` alone. */
  const inert = () => Boolean(local.disabled || local.loading);

  const classes = () =>
    cn(buttonVariants({ intent: local.intent, size: local.size }), local.class);

  /* Absent, never "false". `data-disabled="false"` still matches
     `[data-disabled]`, which would style every enabled button as inert. */
  const flag = (on: boolean) => (on ? true : undefined);

  return (
    <Show
      when={local.asChild}
      fallback={
        <ark.button
          type={local.type ?? "button"}
          disabled={inert()}
          data-disabled={flag(inert())}
          data-loading={flag(Boolean(local.loading))}
          aria-busy={flag(Boolean(local.loading))}
          class={classes()}
          {...rest}
        >
          {local.children}
        </ark.button>
      }
    >
      {(asChild) => (
        /* No `type` — meaningless on an anchor. No native `disabled` — it means
           nothing on one either. The gap this leaves is B16, and it is a rule
           about call sites rather than a handler this component manufactures. */
        <ark.button
          asChild={asChild()}
          aria-disabled={flag(inert())}
          tabindex={inert() ? -1 : undefined}
          data-disabled={flag(inert())}
          data-loading={flag(Boolean(local.loading))}
          aria-busy={flag(Boolean(local.loading))}
          class={classes()}
          {...rest}
        />
      )}
    </Show>
  );
}
