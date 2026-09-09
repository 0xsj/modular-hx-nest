import { cva, type VariantProps } from "class-variance-authority";
import s from "./alert.module.css";

export const alertVariants = cva(s.alert, {
  variants: {
    /** The same five names the badge uses. A tone that means one thing here
     *  and another there is worse than two vocabularies, because it reads as
     *  one. */
    tone: {
      neutral: s.neutral,
      accent: s.accent,
      info: s.info,
      warn: s.warn,
      crit: s.crit,
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type AlertVariants = VariantProps<typeof alertVariants>;
