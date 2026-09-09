import { ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { spaceStyle, splitSpace, type SpaceProps } from "../../style-props";

export type BoxProps = Omit<ComponentProps<typeof ark.div>, "style"> &
  SpaceProps & {
    /** Objects only. A style STRING cannot be merged with the spacing without
     *  parsing CSS, and the version that "works" silently drops one of them. */
    style?: JSX.CSSProperties;
  };

/** A div with spacing, and nothing else.
 *
 *  No background, border, radius or colour — see doc.ts. `asChild` comes from
 *  the factory, so a Box never adds a wrapper element. */
export function Box(props: BoxProps) {
  const [space, rest] = splitSpace(props);
  const [own, others] = splitProps(rest, ["style"]);
  return (
    <ark.div
      {...others}
      /* Built HERE rather than above the return: this position is tracked, so
         a step that changes updates the declaration. Computing it once in the
         body would read the props outside any computation and freeze them. */
      style={{ ...spaceStyle(space), ...own.style }}
    />
  );
}
