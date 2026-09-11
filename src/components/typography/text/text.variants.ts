import { cva, type VariantProps } from "class-variance-authority";
import s from "./text.module.css";

export const textVariants = cva(s.text, {
  variants: {
    size: { sm: s.sm, md: s.md, lg: s.lg },
    tone: {
      default: s.default,
      muted: s.muted,
      quiet: s.quiet,
      accent: s.accent,
      danger: s.danger,
    },
    weight: { regular: s.regular, medium: s.medium, strong: s.strong },
    measure: { true: s.measure },
    truncate: { true: s.truncate },
  },
  defaultVariants: { size: "md", tone: "default", weight: "regular" },
});
export type TextVariants = VariantProps<typeof textVariants>;
