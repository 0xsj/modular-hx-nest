import { cva, type VariantProps } from "class-variance-authority";
import s from "./mark.module.css";

export const markVariants = cva(s.mark, {
  variants: {
    size: { inline: s.inline, display: s.display },
  },
  defaultVariants: { size: "inline" },
});

export type MarkVariants = VariantProps<typeof markVariants>;
