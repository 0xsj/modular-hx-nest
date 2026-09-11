import { cva, type VariantProps } from "class-variance-authority";
import s from "./heading.module.css";

export const headingVariants = cva(s.heading, {
  variants: { size: { sm: s.sm, md: s.md, lg: s.lg, xl: s.xl } },
  defaultVariants: { size: "md" },
});
export type HeadingVariants = VariantProps<typeof headingVariants>;
