import type { JSX } from "solid-js";
import { createMemo, For } from "solid-js";
import type { Source } from "../_lib/source";
import s from "./sink.module.css";

/** A stable anchor from the visible title, so the nav can be derived from the
 *  page rather than declared beside it — a case cannot exist and be unreachable. */
export const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function Section(props: {
  id: string;
  title: string;
  blurb?: string;
  children: JSX.Element;
}) {
  const _titleSlot = createMemo(() => props.title);
  return (
    <section id={props.id} data-section={_titleSlot()} class={s.section}>
      <h1 class={s.sectionTitle}>{_titleSlot()}</h1>
      {props.blurb ? <p class={s.sectionBlurb}>{props.blurb}</p> : null}
      <div class={s.sectionBody}>{props.children}</div>
    </section>
  );
}
export function Row(props: { label: string; children: JSX.Element }) {
  return (
    <div class={s.row}>
      <span class={s.rowLabel}>{props.label}</span>
      {props.children}
    </div>
  );
}

/** The sink's own demo frame. Named `Case` and not `Panel` because
 *  `display/Panel` is a component this page will have to be able to show. */
export function Case(props: {
  title: string;
  note?: string;
  children: JSX.Element;
  sources?: ReadonlyArray<Source>;
}) {
  const _titleSlot2 = createMemo(() => props.title);
  const id = createMemo(() => slug(_titleSlot2()));
  return (
    <div id={id()} data-case={_titleSlot2()} class={s.panel}>
      <div class={s.panelHead}>
        <h2 class={s.panelTitle}>
          <a href={`#${id()}`} class={s.anchor}>
            {_titleSlot2()}
          </a>
        </h2>
        {props.note ? <span class={s.panelNote}>{props.note}</span> : null}
      </div>
      <div class={s.panelBody}>{props.children}</div>
      {props.sources?.length ? (
        /* Collapsed. The source used to be the tallest thing in every case, so
       scrolling the page showed code and the demos were what you passed on
       the way. A <details> needs no component, is keyboard-operable and is
       announced by default. */
        <details class={s.source}>
          <summary class={s.sourceSummary}>
            source
            <span class={s.sourcePaths}>
              {props.sources.map((x) => x.path).join(" · ")}
            </span>
          </summary>
          <For each={props.sources}>
            {(src) => (
              <div>
                <p class={s.codePath}>{src.path}</p>
                <pre class={s.code}>
                  <code>{src.code}</code>
                </pre>
              </div>
            )}
          </For>
        </details>
      ) : null}
    </div>
  );
}
