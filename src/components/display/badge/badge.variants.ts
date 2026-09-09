import { cva, type VariantProps } from "class-variance-authority";
import s from "./badge.module.css";

export const badgeVariants = cva(s.badge, {
  variants: {
    /** Named for MEANING, never for colour. `crit` survives the day the
     *  palette changes; `red` becomes a lie the moment it does, and a
     *  `red` that renders amber is worse than no name at all. */
    tone: {
      neutral: s.neutral,
      accent: s.accent,
      info: s.info,
      warn: s.warn,
      crit: s.crit,
    },
    /** An outline reads as a category and a filled chip as a state. Both
     *  exist so a table can carry two badge columns that do not blur. */
    solid: { true: s.solid },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;
