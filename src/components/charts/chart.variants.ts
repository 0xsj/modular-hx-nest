import { cva, type VariantProps } from "class-variance-authority";
import s from "./charts.module.css";

export const seriesVariants = cva(s.series, {
  variants: {
    tone: { accent: s.accent, info: s.info, warn: s.warn, neutral: s.neutral },
    line: { solid: s.solid, dashed: s.dashed, dotted: s.dotted },
  },
  defaultVariants: { tone: "accent", line: "solid" },
});
export type SeriesVariants = VariantProps<typeof seriesVariants>;
