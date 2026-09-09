import { RadioGroup as Ark } from "@ark-ui/solid";
import { splitProps, type ComponentProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./radio-group.module.css";

export type RadioGroupProps = ComponentProps<typeof Ark.Root>;
export type RadioProps = ComponentProps<typeof Ark.Item> & { children?: JSX.Element };

/** The group owns the value and the arrow-key navigation, and it needs a NAME
 *  of its own — `aria-label`, or `aria-labelledby` at some visible text.
 *
 *  A `Fieldset` legend is not that name, which is the trap: the legend names
 *  the `fieldset`, and the element carrying `role="radiogroup"` is a different
 *  one inside it. Measured — a legend of "Retention" produces a `group` named
 *  Retention and a `radiogroup` named nothing. Wrapping a group in a fieldset
 *  is still right for a real form, because the legend is announced on entry;
 *  it just is not a substitute for this. */
export function RadioGroup(props: RadioGroupProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <Ark.Root {...rest} class={cn(s.group, local.class)} />;
}

/** `Radio`, not `RadioGroupItem`. A radio outside a group is not a thing, so
 *  the shorter name is not ambiguous. */
export function Radio(props: RadioProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <Ark.Item {...rest} class={cn(s.radio, local.class)}>
      <Ark.ItemControl class={s.control} />
      <Ark.ItemText class={s.text}>{local.children}</Ark.ItemText>
      <Ark.ItemHiddenInput />
    </Ark.Item>
  );
}
