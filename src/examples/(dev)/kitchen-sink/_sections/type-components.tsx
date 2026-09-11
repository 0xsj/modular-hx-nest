import { Heading, SectionLabel, Text } from "~/components/typography";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { readSources } from "../_lib/source";
export function TypeComponentsSection() {
  return (
    <Section
      id="type-components"
      title="Typography"
      blurb="Semantic text elements using the shared type scale. Heading level describes the document; size describes its visual emphasis."
    >
      <Case
        title="Heading"
        note="choose a document level independently of its size"
        sources={readSources([
          "typography/heading/heading.tsx",
          "typography/doc.ts",
        ])}
      >
        <Heading level={3} size="xl">
          Build on a clear foundation.
        </Heading>
        <Heading level={3} size="lg">
          A page title
        </Heading>
        <Heading level={3} size="md">
          A section heading
        </Heading>
        <Heading level={3} size="sm">
          A compact heading
        </Heading>
      </Case>
      <Case
        title="Text"
        note="size, tone, weight, readable measure, and intentional truncation"
      >
        <Text size="lg" measure>
          Readable body copy has a comfortable line length and enough space to
          breathe. The same component can be a paragraph or an inline span.
        </Text>
        <Text>
          Default body text, with{" "}
          <Text as="span" weight="strong">
            strong emphasis
          </Text>{" "}
          and{" "}
          <Text as="span" weight="medium">
            medium emphasis
          </Text>
          .
        </Text>
        <Row label="tones">
          <Text tone="muted">Supporting copy</Text>
          <Text tone="quiet">A small annotation</Text>
          <Text tone="accent">Ready to continue</Text>
          <Text tone="danger">Please check this value</Text>
        </Row>
        <Text size="sm">Small text for captions and supporting metadata.</Text>
        <div class={s.controlExample}>
          <Text
            truncate
            title="An intentionally long title that stays on one line when there is not enough space"
          >
            An intentionally long title that stays on one line when there is not
            enough space
          </Text>
        </div>
      </Case>
      <Case
        title="Section label"
        note="a visual category label; it does not invent a heading level"
      >
        <SectionLabel>Workspace settings</SectionLabel>
        <Text tone="muted">
          A small label for context above a title or beside a group of related
          details.
        </Text>
      </Case>
    </Section>
  );
}
