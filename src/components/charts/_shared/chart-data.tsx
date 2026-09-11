import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { Table } from "~/components/display/table";
import s from "../charts.module.css";

/** Ordinary HTML is the exact-value counterpart of the SVG picture. */
export function ChartData(props: { title: string; children: JSX.Element }) {
  const _titleSlot = createMemo(() => props.title);
  return (
    <details class={s.data}>
      <summary>View data for {_titleSlot()}</summary>
      <Table caption={_titleSlot()}>{props.children}</Table>
    </details>
  );
}
