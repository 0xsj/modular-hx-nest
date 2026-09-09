import { type JSX } from "solid-js";
import { VisuallyHidden } from "../visually-hidden";

export type AccessibleIconProps = {
  /** What the icon MEANS, in words. Not what it depicts — see doc.ts. */
  label: string;
  children: JSX.Element;
};

/** An icon that carries meaning, given the words it stands for.
 *
 *  A decorative icon does not use this: it takes `aria-hidden` and says
 *  nothing, because the text beside it already did. */
export function AccessibleIcon(props: AccessibleIconProps) {
  return (
    <>
      {/* The glyph is hidden and the words are supplied beside it, rather than
          putting a label on the svg — an `aria-label` on an element with no
          role is ignored by some readers, and `role="img"` plus a label on an
          inline icon is announced as a separate object mid-sentence. */}
      <span aria-hidden="true" style={{ display: "contents" }}>{props.children}</span>
      <VisuallyHidden>{props.label}</VisuallyHidden>
    </>
  );
}
