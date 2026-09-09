import { cva, type VariantProps } from "class-variance-authority";
import s from "./button.module.css";

/* The single place a variant name maps to a class. A conditional class list in
 * the markup is the alternative, and it puts the map in the render path where
 * a fifth intent has to be added by reading JSX.
 *
 * Every key is listed even where it would map to nothing, because a key
 * present in the type and absent from the map is a runtime `undefined` in the
 * class list — which is what B3 is written to catch. */
export const buttonVariants = cva(s.button, {
  variants: {
    intent: {
      primary: s.primary,
      secondary: s.secondary,
      ghost: s.ghost,
      danger: s.danger,
    },
    size: { sm: s.sm, md: s.md, lg: s.lg, icon: s.icon },
  },
  defaultVariants: { intent: "secondary", size: "md" },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type ButtonIntent = NonNullable<ButtonVariants["intent"]>;
export type ButtonSize = NonNullable<ButtonVariants["size"]>;
