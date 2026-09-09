import { cva, type VariantProps } from "class-variance-authority";
import s from "./text.module.css";

export const textVariants = cva(s.text, {
  variants: {
    size: { xs: s.xs, sm: s.sm, md: s.md, lg: s.lg },
    /** The ink ladder, named for ROLE rather than for lightness — `muted` still
     *  means the same thing after the palette is retuned. */
    tone: {
      default: s.toneDefault,
      muted: s.toneMuted,
      subtle: s.toneSubtle,
      accent: s.toneAccent,
      warn: s.toneWarn,
      crit: s.toneCrit,
    },
    weight: { regular: s.weightRegular, medium: s.weightMedium, strong: s.weightStrong },
    /** For a value read character by character — an id, a hash, a hostname. */
    mono: { true: s.mono },
  },
  defaultVariants: { size: "md", tone: "default", weight: "regular" },
});

export type TextVariants = VariantProps<typeof textVariants>;
