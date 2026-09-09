import { SegmentGroup as Ark } from "@ark-ui/solid";
import { For, splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./segmented.module.css";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = Omit<
  ComponentProps<typeof Ark.Root>,
  /* `onChange` is the DOM event, and this control's `onChange` reports the
     VALUE. Removing the native one stops the two being confusable at a call
     site — the raw event carries the hidden input, which is not the thing a
     caller wants. */
  "value" | "onValueChange" | "onChange" | "children"
> & {
  /** Names the SET. A group of unlabelled radios is announced as a run of
   *  loose options with no idea what is being chosen. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Hide the label from the screen, keep it for a reader. */
  labelHidden?: boolean;
};

/** One of a small set, chosen immediately. Radio semantics, not a row of
 *  toggle buttons — see doc.ts. */
export function Segmented<T extends string>(props: SegmentedProps<T>) {
  const [local, rest] = splitProps(props, [
    "label", "options", "value", "onChange", "labelHidden", "class",
  ]);
  return (
    <Ark.Root
      {...rest}
      class={cn(s.root, local.class)}
      value={local.value}
      onValueChange={(details) => {
        /* The library reports `null` when a selection is cleared. These sets
           always have exactly one, so a null is not a state this control has —
           dropping it is more honest than widening the callback's type. */
        if (details.value !== null) local.onChange(details.value as T);
      }}
    >
      <Ark.Label class={local.labelHidden ? s.labelHidden : s.label}>{local.label}</Ark.Label>
      <div class={s.track}>
        <For each={local.options}>
          {(option) => (
            <Ark.Item value={option.value} class={s.item}>
              <Ark.ItemText class={s.itemText}>{option.label}</Ark.ItemText>
              <Ark.ItemHiddenInput />
            </Ark.Item>
          )}
        </For>
        {/* Decorative: `aria-checked` on the item already carries the state. */}
        <Ark.Indicator class={s.indicator} />
      </div>
    </Ark.Root>
  );
}
