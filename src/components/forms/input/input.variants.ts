import { cva, type VariantProps } from "class-variance-authority";
import s from "./input.module.css";

export const inputVariants = cva(s.input, {
  variants: {
    size: { sm: s.sm, md: s.md, lg: s.lg },
    /** For a value read character by character — an id, a hostname, a token.
     *  Tabular figures and an unambiguous 0/O are not decoration here. */
    mono: { true: s.mono },
    multiline: { true: s.multiline },
  },
  defaultVariants: { size: "md" },
});

export type InputVariants = VariantProps<typeof inputVariants>;
