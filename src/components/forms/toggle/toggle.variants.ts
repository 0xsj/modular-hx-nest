import { cva, type VariantProps } from "class-variance-authority";
import s from "./toggle.module.css";

export const toggleVariants = cva(s.toggle, {
  variants: {
    size: { sm: s.sm, md: s.md, icon: s.icon },
    /** Not decoration. A pill is one of a set of FILTERS; a square is one of a
     *  set of MODES, and those read differently at a glance. */
    shape: { square: s.square, pill: s.pill },
  },
  defaultVariants: { size: "md", shape: "square" },
});

export type ToggleVariants = VariantProps<typeof toggleVariants>;
