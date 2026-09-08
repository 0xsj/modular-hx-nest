import { For, createEffect, createSignal } from "solid-js";
import { Case, Row, Section } from "../_components/section";
import { fontStacks } from "../_lib/tokens";
import s from "../_components/sink.module.css";

const SIZES = ["--text-9", "--text-10", "--text-11", "--text-11-5", "--text-12", "--text-12-5", "--text-13", "--text-15", "--text-18", "--text-22", "--text-30", "--text-42", "--text-54"];
const WEIGHTS = ["--weight-regular", "--weight-medium", "--weight-strong", "--weight-bold"];
const LEADING = ["--leading-tight", "--leading-snug", "--leading-body"];
const TRACKING = ["--tracking-tight", "--tracking-label"];

const PANGRAM = "Sphinx of black quartz, judge my vow — 0123456789";

export function TypographySection(props: { revision: number }) {
  const [stacks, setStacks] = createSignal({ sans: "", mono: "", body: "" });
  createEffect(() => {
    props.revision;
    setStacks(fontStacks());
  });

  return (
    <Section
      id="typography"
      title="Typography"
      blurb="The scale, with no primitives on top of it yet. Heading and Text are where a level and a size stop being the same decision; until those exist this section is the raw ladder they will read from."
    >
      <Case title="Stacks" note="resolved from the document, not from the stylesheet">
        <Row label="--font-sans"><span class={s.mono}>{stacks().sans || "—"}</span></Row>
        <Row label="--font-mono"><span class={s.mono}>{stacks().mono || "—"}</span></Row>
        <Row label="body"><span class={s.mono}>{stacks().body || "—"}</span></Row>
        <p class={s.caseNote}>
          Nothing sets <code>--font-sans-src</code> or <code>--font-mono-src</code> in this
          template, so both fall through to the system stack. That is a hook doing its job, not a
          failure — but the fallback has to live <em>inside</em> the <code>var()</code>.{" "}
          <strong>Measured, and it was wrong first:</strong> written as{" "}
          <code>var(--font-sans-src)</code> with no fallback, an undefined hook makes the whole
          declaration invalid at computed-value time, <code>--font-sans</code> resolves to the
          empty string, and the page renders in the UA default serif. This tree rendered in Times
          until it was read back rather than looked at.
        </p>
        <p class={s.caseNote}>
          <strong>What this cannot tell you:</strong> which physical face the operating system
          then chose. The stack resolving is observable; the render is not, from here.
        </p>
      </Case>

      <Case title="Sizes" note="13 steps, and the small end is the one that carries information">
        <For each={SIZES}>
          {(t) => (
            <Row label={t}>
              <span style={{ "font-size": `var(${t})` }}>{PANGRAM}</span>
            </Row>
          )}
        </For>
      </Case>

      <Case title="Weights">
        <For each={WEIGHTS}>
          {(t) => (
            <Row label={t}>
              <span style={{ "font-weight": `var(${t})`, "font-size": "var(--text-15)" }}>{PANGRAM}</span>
            </Row>
          )}
        </For>
      </Case>

      <Case title="Leading and tracking">
        <For each={LEADING}>
          {(t) => (
            <Row label={t}>
              <span class={s.measure} style={{ "line-height": `var(${t})` }}>
                A note answers why this looks like this, for a reader who can already see what it
                does. Restating the code is the failure mode, and it is the one that rots a corpus.
              </span>
            </Row>
          )}
        </For>
        <For each={TRACKING}>
          {(t) => (
            <Row label={t}>
              <span style={{ "letter-spacing": `var(${t})`, "font-size": "var(--text-15)" }}>{PANGRAM}</span>
            </Row>
          )}
        </For>
      </Case>

      <Case title="Mono" note="the face runs larger at equal nominal size">
        <Row label="--font-mono">
          <span class={s.mono} style={{ "font-size": "var(--text-13)" }}>{PANGRAM}</span>
        </Row>
        <Row label="--font-sans">
          <span style={{ "font-size": "var(--text-13)" }}>{PANGRAM}</span>
        </Row>
        <p class={s.caseNote}>
          Both at <code>--text-13</code>. If the two lines look identical the mono stack is not
          resolving — which is the cheapest check on this page and the one that would have caught
          the fallback bug above.
        </p>
      </Case>
    </Section>
  );
}
