import { Checkbox as Ark } from "@ark-ui/solid";
import { createEffect, splitProps, type ComponentProps } from "solid-js";
import { Check, Minus } from "~/components/utility";
import { cn } from "~/lib/kernel";
import s from "./checkbox.module.css";

export type CheckboxProps = ComponentProps<typeof Ark.Root>;

/** Three states, and the third is not a styling of the other two. */
/* `id` addresses the CONTROL, not the root.
   The library treats a root `id` as a SEED and derives the real ids from it
   (`id` -> `checkbox:id`, input `checkbox:id:input`), so a caller who writes
   `<Label for={id}>` beside this ends up pointing at nothing — no accessible
   name, and the words are not a hit target. Mapping it onto `ids.hiddenInput`
   moves both the input's id and the root's own `for` at once, and makes `id`
   mean here what it means on every native control. */
export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, ["class", "id"]);
  return (
    <Ark.Root
      {...rest}
      ids={local.id ? { hiddenInput: local.id } : undefined}
      class={cn(s.checkbox, local.class)}
    >
      <Ark.Control class={s.control}>
        {/* Both glyphs are present and `data-state` decides which shows.
            Indeterminate is a STATE, not a variant: a variant is chosen by the
            author, a state comes from the data. */}
        <Ark.Indicator class={s.indicator}>
          <Check size={12} stroke-width={3} aria-hidden="true" />
        </Ark.Indicator>
        <Ark.Indicator indeterminate class={s.indicator}>
          <Minus size={12} stroke-width={3} aria-hidden="true" />
        </Ark.Indicator>
      </Ark.Control>
      {/* The library draws the third state with `data-state` but never syncs
          the input, so the accessibility tree announces `indeterminate` as
          plain unchecked — the state is visible and unannounced. `indeterminate`
          is a PROPERTY with no attribute form, so it can only be set here.
          Read from the live api rather than the prop, so an uncontrolled
          checkbox is covered too. */}
      <Ark.Context>
        {(api) => {
          let input!: HTMLInputElement;
          createEffect(() => {
            input.indeterminate = api().indeterminate;
          });
          return <Ark.HiddenInput ref={input} />;
        }}
      </Ark.Context>
    </Ark.Root>
  );
}
