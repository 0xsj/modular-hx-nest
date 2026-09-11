import type { JSX } from "solid-js";
import { createMemo, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { ArrowDown, ArrowUp, ArrowUpDown } from "~/components/utility";
import { Th, type ThProps } from "./table";
import s from "./table.module.css";
export type SortableThProps = Omit<ThProps, "children" | "aria-sort"> & {
  children: JSX.Element;
  direction: "ascending" | "descending" | "none";
  onSort: () => void;
};
export function SortableTh(componentProps: SortableThProps) {
  const [, props] = splitProps(componentProps, [
    "children",
    "direction",
    "onSort",
  ]);
  const Icon = createMemo(() =>
    componentProps.direction === "ascending"
      ? ArrowUp
      : componentProps.direction === "descending"
        ? ArrowDown
        : ArrowUpDown,
  );
  return (
    <Th aria-sort={componentProps.direction} {...props}>
      <button
        type="button"
        class={s.sort}
        onClick={() => componentProps.onSort()}
      >
        {componentProps.children}
        <Dynamic component={Icon()} size={12} aria-hidden="true" />
      </button>
    </Th>
  );
}
