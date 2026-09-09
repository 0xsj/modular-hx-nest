import { Switch as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./switch.module.css";

export type SwitchProps = ComponentProps<typeof Ark.Root>;

/** A setting that takes effect when you press it. Not a checkbox — see doc.ts;
 *  the two are interchangeable to look at and neither substitutes for the
 *  other. */
/* `id` addresses the CONTROL, not the root.
   The library treats a root `id` as a SEED and derives the real ids from it
   (`id` -> `switch:id`, input `switch:id:input`), so a caller who writes
   `<Label for={id}>` beside this ends up pointing at nothing — no accessible
   name, and the words are not a hit target. Mapping it onto `ids.hiddenInput`
   moves both the input's id and the root's own `for` at once, and makes `id`
   mean here what it means on every native control. */
export function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, ["class", "id"]);
  return (
    <Ark.Root
      {...rest}
      ids={local.id ? { hiddenInput: local.id } : undefined}
      class={cn(s.switch, local.class)}
    >
      <Ark.Control class={s.control}>
        <Ark.Thumb class={s.thumb} />
      </Ark.Control>
      {/* The library renders a bare `input type=checkbox`, so without this a
          switch is announced as a checkbox — the one distinction doc.ts says
          is not cosmetic. Valid ARIA: `switch` is a subclass of `checkbox`,
          and the native checked state supplies `aria-checked`. */}
      <Ark.HiddenInput role="switch" />
    </Ark.Root>
  );
}
