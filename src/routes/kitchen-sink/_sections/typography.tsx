import { For, createEffect, createSignal } from "solid-js";
import { Heading, SectionLabel, Text } from "~/components/typography";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import { fontStacks } from "../_lib/tokens";
import headingSrc from "~/components/typography/heading/heading.tsx?raw";
import textSrc from "~/components/typography/text/text.tsx?raw";
import sectionLabelSrc from "~/components/typography/section-label/section-label.tsx?raw";
import s from "../_components/sink.module.css";

const SIZES = ["--text-9", "--text-10", "--text-11", "--text-11-5", "--text-12", "--text-12-5", "--text-13", "--text-15", "--text-18", "--text-22", "--text-30", "--text-42", "--text-54"];
const WEIGHTS = ["--weight-regular", "--weight-medium", "--weight-strong", "--weight-bold"];
const LEADING = ["--leading-tight", "--leading-snug", "--leading-body"];
const TRACKING = ["--tracking-tight", "--tracking-label"];

const PANGRAM = "Sphinx of black quartz, judge my vow — 0123456789";

const typoSrc = {
  heading: [source("typography/heading/heading.tsx", headingSrc)],
  text: [source("typography/text/text.tsx", textSrc)],
  label: [source("typography/section-label/section-label.tsx", sectionLabelSrc)],
} satisfies Record<string, readonly Source[]>;

/* 2–6, not 1. This page already has an h1, and a demo of the rule should
   not be the thing that breaks it — see the case note. */
const LEVELS = [2, 3, 4, 5, 6] as const;
const HEADING_SIZES = ["xs", "sm", "md", "lg", "xl", "display"] as const;
const TONES = ["default", "muted", "subtle", "accent", "warn", "crit"] as const;

export function TypographySection() {
  const [stacks, setStacks] = createSignal({ sans: "", mono: "", body: "" });
  createEffect(() => {
    setStacks(fontStacks());
  });

  return (
    <Section
      id="typography"
      title="Typography"
      blurb="The scale, and the three primitives that read from it. The argument the group turns on is that a heading's LEVEL and its SIZE are different decisions — one is the document's outline and the other is how big it looks, and fusing them produces a page whose outline is a description of the type scale."
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

      <Case title="Heading" note="level ≠ size" sources={typoSrc.heading}>
        <Row label="size">
          <div class={s.stack}>
            <For each={HEADING_SIZES}>
              {(size) => <Heading level={3} size={size}>{size} — always an h3</Heading>}
            </For>
          </div>
        </Row>
        <Row label="level">
          <div class={s.stack}>
            <For each={LEVELS}>
              {(level) => <Heading level={level} size="sm">h{level} — always size sm</Heading>}
            </For>
          </div>
        </Row>
        <p class={s.caseNote}>
          Both columns above are the point. Every heading in the first is an <code>h3</code>{" "}
          and they look nothing alike; every heading in the second looks identical and they
          occupy six different places in the outline. With one prop those are impossible.
        </p>
        <p class={s.caseNote}>
          <code>level={"{1}"}</code> is deliberately not shown: this page already has one{" "}
          <code>h1</code> — "Kitchen sink" — and a demonstration of the outline rules should
          not be the thing that breaks them. That the omission is even noticeable is the
          argument for the component.
        </p>
        <p class={s.caseNote}>
          <code>level</code> has <strong>no default</strong>. Defaulting it to 2 would make the
          common case shorter and the failure silent — a page with no <code>h1</code>, or one
          that skips from <code>h1</code> to <code>h3</code>, looks completely normal. A reader
          navigating by headings is the one who finds out.
        </p>
      </Case>

      <Case title="Text" note="tone · weight · clamp" sources={typoSrc.text}>
        <Row label="tone">
          <div class={s.stack}>
            <For each={TONES}>{(tone) => <Text tone={tone}>{tone}</Text>}</For>
          </div>
        </Row>
        <Row label="element">
          <Text>a paragraph, by default</Text>
          <Text as="span">a span, for text inside a sentence</Text>
          <Text as="strong">strong, which is announced</Text>
        </Row>
        <Row label="clamp">
          <div style={{ "inline-size": "260px" }}>
            <Text lines={2}>
              A clamp is lossy: the text that is cut is unreachable for everyone, so it is only
              correct when the full value exists somewhere else — a detail view, an expand, a
              copy button.
            </Text>
          </div>
        </Row>
        <p class={s.caseNote}>
          <code>as="strong"</code> is not <code>weight="strong"</code>. One carries meaning a
          reader announces; the other is appearance. Reaching for the weight prop when the
          point is emphasis loses it silently.
        </p>
        <p class={s.caseNote}>
          Only the line COUNT is set inline, as a custom property — the{" "}
          <code>-webkit-</code> clamp declarations live in the stylesheet. Set inline they go
          through the CSSOM, which drops the properties it does not recognise and leaves an
          element with <code>overflow: hidden</code> and no clamp at all.
        </p>
      </Case>

      <Case title="SectionLabel" note="a mark, not a heading" sources={typoSrc.label}>
        <Row label="default">
          <div class={s.stack}>
            <SectionLabel>Retention</SectionLabel>
            <Text tone="muted">A div — it groups on the screen and stays out of the outline.</Text>
          </div>
        </Row>
        <Row label="as a heading">
          <div class={s.stack}>
            <SectionLabel as="h3">Retention</SectionLabel>
            <Text tone="muted">Same appearance, now a jump target.</Text>
          </div>
        </Row>
        <p class={s.caseNote}>
          A <code>div</code> by default, because this mark appears above stat groups, table
          columns and menu sections — and making every one a heading fills the outline with a
          dozen two-word fragments, which makes it useless for finding the section you want.
          Pass a level when the label genuinely <em>names</em> a region.
        </p>
        <p class={s.caseNote}>
          The uppercase is <code>text-transform</code>, not the string. The accessible name
          keeps the case it was written in — typing "RETENTION" into the markup is how a reader
          ends up spelling it out, because some assistive technology treats a fully-capitalised
          word as an acronym.
        </p>
      </Case>
    </Section>
  );
}
