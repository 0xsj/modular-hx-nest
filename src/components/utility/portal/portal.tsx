import { Portal as SolidPortal } from "solid-js/web";
import type { ComponentProps } from "solid-js";

export type PortalProps = ComponentProps<typeof SolidPortal>;

/** Render elsewhere in the DOM without leaving the component tree.
 *
 *  A thin re-export, and deliberately so — see doc.ts. */
export function Portal(props: PortalProps) {
  return <SolidPortal {...props} />;
}
