import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./table.module.css";

export type TableProps = {
  /** Names the table for a reader who arrived by jumping between tables and
   *  has none of the surrounding page. */
  caption?: string;
  class?: string;
  children: JSX.Element;
};

export function Table(props: TableProps) {
  return (
    /* The scroller is a separate element from the table, and it is focusable
       and labelled: a region that scrolls must be reachable by keyboard, or
       the columns past the fold cannot be seen without a mouse. */
    <div class={s.scroll} tabindex="0" role="region" aria-label={props.caption}>
      <table class={cn(s.table, props.class)}>
        <Show when={props.caption}>
          <caption class={s.caption}>{props.caption}</caption>
        </Show>
        {props.children}
      </table>
    </div>
  );
}

export function THead(props: { class?: string; children: JSX.Element }) {
  return <thead class={cn(s.thead, props.class)}>{props.children}</thead>;
}

export function TBody(props: { class?: string; children: JSX.Element }) {
  return <tbody class={cn(s.tbody, props.class)}>{props.children}</tbody>;
}

export type TrProps = JSX.HTMLAttributes<HTMLTableRowElement>;
export function Tr(props: TrProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <tr {...rest} class={cn(s.tr, local.class)} />;
}

export type ThProps = JSX.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };

/** Always carries a `scope`. Without one a reader cannot tell whether a header
 *  describes its column or its row, and a wide table stops being navigable. */
export function Th(props: ThProps) {
  const [local, rest] = splitProps(props, ["class", "numeric", "scope"]);
  return (
    <th
      {...rest}
      scope={local.scope ?? "col"}
      class={cn(s.th, local.numeric && s.numeric, local.class)}
    />
  );
}

export type TdProps = JSX.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };
export function Td(props: TdProps) {
  const [local, rest] = splitProps(props, ["class", "numeric"]);
  return <td {...rest} class={cn(s.td, local.numeric && s.numeric, local.class)} />;
}
