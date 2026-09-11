import { cva, type VariantProps } from "class-variance-authority";
import s from "./button.module.css";

/* The variant map is the single definition of `intent` and `size`. The prop
   type below is derived from it, so the CSS class map and the type cannot
   drift — adding a class without a type, or a type without a class, is not
   expressible. */
export const buttonVariants = cva(s.button, {
  variants: {
    intent: {
      primary: s.primary,
      secondary: s.secondary,
      ghost: s.ghost,
      danger: s.danger,
      link: s.link,
    },
    size: { sm: s.sm, md: s.md, lg: s.lg, icon: s.icon },
  },
  defaultVariants: { intent: "secondary", size: "md" },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonIntent = NonNullable<ButtonVariants["intent"]>;
export type ButtonSize = NonNullable<ButtonVariants["size"]>;
