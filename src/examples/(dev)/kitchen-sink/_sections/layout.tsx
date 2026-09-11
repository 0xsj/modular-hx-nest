import { For } from "solid-js";
import { Badge } from "~/components/display";
import {
  Box,
  Container,
  Flex,
  Separator,
  SPACE_STEPS,
} from "~/components/layout";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
export function LayoutSection() {
  return (
    <Section
      id="layout"
      title="Layout"
      blurb="Four primitives and a spacing shorthand. The shorthand resolves to the existing tokens and emits an inline style, so it adds nothing to the cascade and invents no second scale — which is what keeps it a typed accessor to the token layer rather than a utility framework."
    >
      <Case
        title="Space props"
        note="p · px · py · pt · pb · pl · pr · m… · gap — twelve steps, one scale"
      >
        <div class={s.scale}>
          <For each={SPACE_STEPS.filter((n) => n > 0)}>
            {(n) => (
              <div class={s.scaleRow}>
                <span class={s.mono}>
                  p={"{"}
                  {n}
                  {"}"}
                </span>
                <span class={s.mono} />
                <Box p={n} class={s.spaceBox}>
                  <span class={s.spaceInner} />
                </Box>
              </div>
            )}
          </For>
        </div>
        <p class={s.limits}>
          <code>
            p={"{"}3{"}"}
          </code>{" "}
          is <code>var(--space-3)</code> — not a number this utility decided on.
          There is no second scale to keep in step, and nothing is generated:
          the props emit an inline style, so <code>@layer primitive</code> is
          untouched by a caller adjusting a gap.
        </p>
        <p class={s.limits}>
          <strong>The edge shorthands are logical.</strong> <code>pl</code> is
          inline-start, not left — the familiar letters, following the text
          rather than the screen, so a right-to-left document is correct without
          a second set of props. Scope is spacing and flow only: no colour, no
          type, no borders. A prop for those would let a screen restyle a
          primitive from outside.
        </p>
      </Case>

      <Case
        title="Box"
        note="a div with spacing props, and no appearance of its own"
      >
        <Row label="padding">
          <Box p={6} class={s.spaceBox}>
            p={"{"}6{"}"}
          </Box>
        </Row>
        <Row label="asymmetric">
          <Box py={3} px={8} class={s.spaceBox}>
            py={"{"}3{"}"} px={"{"}8{"}"}
          </Box>
        </Row>
        <p class={s.limits}>
          It has no background, border, radius or colour, and takes no props for
          them. <code>asChild</code> renders the caller&rsquo;s element carrying
          the spacing, so a Box never adds a wrapper.
        </p>
      </Case>

      <Case title="Flex" note="direction · align · justify · wrap · grow">
        <Row label="row">
          <Flex gap={4} align="center" class={s.spaceBox}>
            <Badge tone="accent">one</Badge>
            <Badge>two</Badge>
            <Badge>three</Badge>
          </Flex>
        </Row>
        <Row label="grow">
          <Flex gap={4} class={s.fullWidth}>
            <Box class={s.spaceBox} p={3}>
              fixed
            </Box>
            <Flex grow class={s.spaceBox} p={3}>
              grow — and min-inline-size: 0
            </Flex>
          </Flex>
        </Row>
        <p class={s.limits}>
          <code>grow</code> also sets <code>min-inline-size: 0</code>. A flex
          child defaults to <code>auto</code>, which refuses to shrink below its
          content and overflows the row — the commonest flex defect, and not the
          caller&rsquo;s fault to fix.
        </p>
      </Case>

      <Case
        title="Container"
        note="centres, and caps in characters rather than pixels"
      >
        <Container width="measure" class={s.spaceBox}>
          A reading column, capped by <code>--measure</code> in ch units,
          because legibility depends on characters per line rather than on
          pixels. The only arrangement decision this group makes on a
          screen&rsquo;s behalf.
        </Container>
      </Case>

      <Case
        title="Separator"
        note="announced by default; decorative when it is only grouping"
      >
        <Row label="horizontal">
          <div class={s.fullWidth}>
            <Box py={3}>above</Box>
            <Separator decorative />
            <Box py={3}>below</Box>
          </div>
        </Row>
        <Row label="vertical">
          <Flex gap={5} align="center">
            <span>one</span>
            <Separator orientation="vertical" decorative />
            <span>two</span>
          </Flex>
        </Row>
        <p class={s.limits}>
          The primitive announces a separator unless told otherwise, and that
          default is kept rather than inverted — quietly changing a
          library&rsquo;s default is how a wrapper surprises somebody reading
          the library&rsquo;s docs. Pass <code>decorative</code> for a rule a
          reader already gets from the headings around it, which is most of
          them.
        </p>
      </Case>
    </Section>
  );
}
