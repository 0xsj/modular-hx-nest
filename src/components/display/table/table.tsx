import { mergeProps, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./table.module.css";

/* Compositional rather than data-driven.
 *
 * A `<Table columns={} rows={} />` has to grow a renderer prop per column the
 * moment one cell is not a string — and every one of them re-invents markup the
 * platform already has. Composition costs a few more lines at the call site and
 * never runs out. */

export type TableProps = JSX.HTMLAttributes<HTMLTableElement> & {
  caption?: string;
  scrollLabel?: string;
};
export function Table(componentProps: TableProps) {
  const [, props] = splitProps(componentProps, [
    "caption",
    "scrollLabel",
    "class",
    "children",
  ]);
  return (
    <div
      class={s.scroll}
      tabindex={0}
      role="region"
      aria-label={
        componentProps.scrollLabel ??
        componentProps.caption ??
        "Scrollable table"
      }
    >
      <table class={cn(s.table, componentProps.class)} {...props}>
        {/* Named for a reader even when the heading above it is visible: a
            table reached by jumping between tables has no surrounding context. */}
        {componentProps.caption ? (
          <caption class={s.caption}>{componentProps.caption}</caption>
        ) : null}
        {componentProps.children}
      </table>
    </div>
  );
}
export const THead = (
  componentProps: JSX.HTMLAttributes<HTMLTableSectionElement>,
) => {
  const [, props] = splitProps(componentProps, ["class"]);
  return <thead class={cn(s.head, componentProps.class)} {...props} />;
};
export const TBody = (props: JSX.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props} />
);
export const TFoot = (
  componentProps: JSX.HTMLAttributes<HTMLTableSectionElement>,
) => {
  const [, props] = splitProps(componentProps, ["class"]);
  return <tfoot class={cn(s.foot, componentProps.class)} {...props} />;
};
export const Tr = (componentProps: JSX.HTMLAttributes<HTMLTableRowElement>) => {
  const [, props] = splitProps(componentProps, ["class"]);
  return <tr class={cn(s.row, componentProps.class)} {...props} />;
};
export type ThProps = JSX.ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

/** Always carries a scope. Without one a reader cannot tell whether a header
 *  describes its column or its row, and a wide table becomes unreadable. */
export function Th(incomingProps: ThProps) {
  const componentProps = mergeProps(
    {
      scope: "col",
    } as const,
    incomingProps,
  );
  const [, props] = splitProps(componentProps, ["class", "numeric", "scope"]);
  return (
    <th
      scope={componentProps.scope}
      class={cn(
        s.th,
        componentProps.numeric && s.numeric,
        componentProps.class,
      )}
      {...props}
    />
  );
}
export type TdProps = JSX.TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};
export function Td(componentProps: TdProps) {
  const [, props] = splitProps(componentProps, ["class", "numeric"]);
  return (
    <td
      class={cn(
        s.td,
        componentProps.numeric && s.numeric,
        componentProps.class,
      )}
      {...props}
    />
  );
}
