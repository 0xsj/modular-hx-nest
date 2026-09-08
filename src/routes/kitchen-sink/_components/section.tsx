import type { JSX } from "solid-js";
import { Show } from "solid-js";
import s from "./sink.module.css";

/* Section · Case · Row — the sink's own furniture.
 *
 * These are NOT design-system components and must not become them. They exist
 * so the page can show a catalogue it has no catalogue to show it with, and
 * the day `components/display/panel` lands, this file does not become its
 * caller. `Case` in particular is named for that reason: `Panel` is a
 * component this page has to be able to display, so the frame around a demo
 * cannot share its name.
 *
 * No default export — a file under `src/routes` becomes a route if and only if
 * it has one. */

/** A stable anchor derived from the visible title, so both navigations can be
 *  read off the page rather than declared beside it. A case cannot exist and be
 *  unreachable. */
export const slug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function Section(props: {
  id: string;
  title: string;
  blurb?: string;
  children: JSX.Element;
}) {
  return (
    <section id={props.id} data-section={props.title} class={s.section}>
      <h2 class={s.sectionTitle}>{props.title}</h2>
      <Show when={props.blurb}>
        <p class={s.sectionBlurb}>{props.blurb}</p>
      </Show>
      <div class={s.sectionBody}>{props.children}</div>
    </section>
  );
}

export function Row(props: { label: string; children: JSX.Element }) {
  return (
    <div class={s.row}>
      <span class={s.rowLabel}>{props.label}</span>
      <div class={s.rowBody}>{props.children}</div>
    </div>
  );
}

export function Case(props: {
  title: string;
  note?: string;
  children: JSX.Element;
}) {
  const id = slug(props.title);
  return (
    <div id={id} data-case={props.title} class={s.case}>
      <div class={s.caseHead}>
        <h3 class={s.caseTitle}>
          <a href={`#${id}`} class={s.anchor}>{props.title}</a>
        </h3>
        <Show when={props.note}>
          <span class={s.caseNote}>{props.note}</span>
        </Show>
      </div>
      <div class={s.caseBody}>{props.children}</div>
    </div>
  );
}

/** The status chip. Local to the sink for the same reason as `Case` — a
 *  `Badge` primitive is a thing this page will one day have to display. */
export function Chip(props: { tone?: "accent" | "warn" | "crit" | "info"; glyph?: string; children: JSX.Element }) {
  return (
    <span class={s.chip} data-tone={props.tone ?? "neutral"}>
      <Show when={props.glyph}>
        {/* aria-hidden because the chip's own text says the same thing, and a
            reader announcing "check accepted" has been told twice. */}
        <span aria-hidden="true" class={s.chipGlyph}>{props.glyph}</span>
      </Show>
      {props.children}
    </span>
  );
}
