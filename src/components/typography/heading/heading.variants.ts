import { cva, type VariantProps } from "class-variance-authority";
import s from "./heading.module.css";

export const headingVariants = cva(s.heading, {
  variants: {
    /** APPEARANCE only. The document level is `level`, and the two are
     *  deliberately not the same prop — see doc.ts. */
    size: { xs: s.xs, sm: s.sm, md: s.md, lg: s.lg, xl: s.xl, display: s.display },
    tone: { default: s.toneDefault, muted: s.toneMuted },
  },
  defaultVariants: { size: "md", tone: "default" },
});

export type HeadingVariants = VariantProps<typeof headingVariants>;
