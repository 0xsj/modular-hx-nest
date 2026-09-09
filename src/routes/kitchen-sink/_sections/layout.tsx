import { For } from "solid-js";
import { Box, Container, Flex, Separator, SPACE_STEPS } from "~/components/layout";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import boxSrc from "~/components/layout/box/box.tsx?raw";
import containerSrc from "~/components/layout/container/container.tsx?raw";
import flexSrc from "~/components/layout/flex/flex.tsx?raw";
import separatorSrc from "~/components/layout/separator/separator.tsx?raw";
import stylePropsSrc from "~/components/style-props.ts?raw";

const src = {
  box: [
    source("layout/box/box.tsx", boxSrc),
    source("style-props.ts", stylePropsSrc),
  ],
  flex: [source("layout/flex/flex.tsx", flexSrc)],
  container: [source("layout/container/container.tsx", containerSrc)],
  separator: [source("layout/separator/separator.tsx", separatorSrc)],
} satisfies Record<string, readonly Source[]>;

const Fill = (props: { children?: string }) => (
  <div class={s.demoFill}>{props.children ?? "item"}</div>
);

export function LayoutSection() {
  return (
    <Section
      id="layout"
      title="Layout"
      blurb="Four primitives and a shared set of spacing props. Nothing in this group has an appearance — the test for belonging here is whether you could tell it was present with the colours removed. The tinted boxes below are the page's, not the components'."
    >
      <Case title="Space scale" note="steps, never lengths" sources={src.box}>
        <Row label="steps">
          <Flex direction="column" gap={1}>
            <For each={SPACE_STEPS}>
              {(step) => (
                <Flex align="center" gap={3}>
                  <code class={s.caseNote} style={{ "min-inline-size": "2.5ch" }}>{step}</code>
                  <Box p={0} class={s.demoFill} style={{ "inline-size": step === 0 ? "1px" : `var(--space-${step})`, padding: "0", "block-size": "12px" }} />
                </Flex>
              )}
            </For>
          </Flex>
        </Row>
        <p class={s.caseNote}>
          Every spacing prop takes a <strong>step</strong>, so <code>p={"{20}"}</code> is a
          compile error and a call site cannot introduce a thirteenth value. <code>0</code> is
          the one literal — there is no <code>--space-0</code> token, because zero is not a
          size.
        </p>
        <p class={s.caseNote}>
          There is no <code>pl</code> or <code>pr</code>. The props are <code>ps</code> and{" "}
          <code>pe</code> — inline start and end — because every stylesheet here is written in
          logical properties, and a <code>pl</code> that means "left" becomes a lie the first
          time the app renders right-to-left. It is a lie nothing detects: the layout is
          merely mirrored wrongly.
        </p>
      </Case>

      <Case title="Box" note="spacing, and no appearance" sources={src.box}>
        <Row label="padding">
          <Box p={2} class={s.demoEdge}><Fill>p=2</Fill></Box>
          <Box p={5} class={s.demoEdge}><Fill>p=5</Fill></Box>
          <Box px={7} py={2} class={s.demoEdge}><Fill>px=7 py=2</Fill></Box>
        </Row>
        <Row label="logical sides">
          <Box ps={7} class={s.demoEdge}><Fill>ps=7</Fill></Box>
          <Box pe={7} class={s.demoEdge}><Fill>pe=7</Fill></Box>
          <Box pt={6} pb={1} class={s.demoEdge}><Fill>pt=6 pb=1</Fill></Box>
        </Row>
        <Row label="override order">
          <Box p={6} pt={0} class={s.demoEdge}><Fill>p=6 pt=0</Fill></Box>
        </Row>
        <p class={s.caseNote}>
          The last one is the case that decides the implementation. A style object applies in
          insertion order, so the shorthand has to be written before the sides — reversed,{" "}
          <code>p={"{6}"} pt={"{0}"}</code> applies the 6 after the 0 and silently ignores the
          override.
        </p>
        <p class={s.caseNote}>
          A Box has no class of its own: no background, border, radius or colour. One that
          could be styled from outside would let a screen restyle a primitive, and the result
          would look like a <code>Panel</code> without being one.
        </p>
      </Case>

      <Case title="Flex" note="direction · align · justify · gap · grow" sources={src.flex}>
        <Row label="gap">
          <Flex gap={2}><Fill /><Fill /><Fill /></Flex>
          <Flex gap={6}><Fill /><Fill /><Fill /></Flex>
        </Row>
        <Row label="direction">
          <Flex direction="column" gap={2}><Fill>one</Fill><Fill>two</Fill></Flex>
        </Row>
        <Row label="justify">
          <Flex gap={2} justify="space-between" class={s.demoEdge} style={{ "inline-size": "260px" }}>
            <Fill>start</Fill><Fill>end</Fill>
          </Flex>
        </Row>
        <Row label="align">
          <Flex gap={2} align="center" class={s.demoEdge}>
            <Fill>a</Fill>
            <div class={s.demoFill} style={{ "block-size": "48px" }}>tall</div>
          </Flex>
        </Row>
        <Row label="grow">
          <Flex gap={2} class={s.demoEdge} style={{ "inline-size": "320px" }}>
            <Box><Fill>fixed</Fill></Box>
            <Flex grow><Fill>grow</Fill></Flex>
          </Flex>
        </Row>
        <p class={s.caseNote}>
          <code>grow</code> is <code>flex: 1 1 0</code>, not <code>flex-grow: 1</code>. The
          difference is the basis: with <code>auto</code>, children share the{" "}
          <em>leftover</em> space in proportion to their content, so two columns that should be
          equal are not — and it looks almost right, which is why it survives review.
        </p>
        <p class={s.caseNote}>
          Every Flex sets <code>min-inline-size: 0</code>. A flex child refuses to shrink below
          its content by default, and nothing in the author's CSS mentions a minimum — so a
          long unbroken string produces a horizontal overflow with no visible cause.
        </p>
      </Case>

      <Case title="Container" note="page · measure" sources={src.container}>
        <Row label="measure">
          <Container width="measure" class={s.demoEdge}>
            <p class={s.caseNote}>
              A reading column is capped in <strong>characters</strong>, not pixels, because
              that is what legibility depends on — the eye loses the start of the next line
              somewhere past about seventy-five of them, and that limit does not move when the
              font size does. This paragraph is inside one.
            </p>
          </Container>
        </Row>
        <p class={s.caseNote}>
          The only layout decision this group makes on a screen's behalf, because a reading
          measure is a typographic fact rather than an arrangement. It is also the one
          primitive here without <code>asChild</code>: centring and capping need an element by
          definition, so there is nothing for it to become.
        </p>
      </Case>

      <Case title="Separator" note="decorative by default" sources={src.separator}>
        <Row label="horizontal">
          <Box style={{ "inline-size": "280px" }}>
            <Fill>above</Fill>
            <Box py={3}><Separator /></Box>
            <Fill>below</Fill>
          </Box>
        </Row>
        <Row label="vertical">
          <Flex gap={3} align="center">
            <Fill>one</Fill>
            <Separator orientation="vertical" />
            <Fill>two</Fill>
            <Separator orientation="vertical" />
            <Fill>three</Fill>
          </Flex>
        </Row>
        <p class={s.caseNote}>
          Decorative by default — <code>role="none"</code> and <code>aria-hidden</code>. A line
          that only reinforces grouping the structure already states is noise in the
          accessibility tree, and most separators are exactly that. Pass{" "}
          <code>decorative={"{false}"}</code> when the rule is the <em>only</em> thing saying
          two groups are different.
        </p>
        <p class={s.caseNote}>
          It is a background rather than a border: a 1px border on a zero-size box is rounded
          away at some zoom levels and disappears entirely at others.
        </p>
      </Case>
    </Section>
  );
}
