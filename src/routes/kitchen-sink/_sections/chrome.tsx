import { DensityToggle, Mark, PRODUCT_NAME, Segmented, ThemeToggle } from "~/components/chrome";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { createSignal } from "solid-js";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import densityToggleSrc from "~/components/chrome/density-toggle/density-toggle.tsx?raw";
import markSrc from "~/components/chrome/mark/mark.tsx?raw";
import segmentedSrc from "~/components/chrome/segmented/segmented.tsx?raw";
import themeToggleSrc from "~/components/chrome/theme-toggle/theme-toggle.tsx?raw";

const src = {
  mark: [source("chrome/mark/mark.tsx", markSrc)],
  segmented: [source("chrome/segmented/segmented.tsx", segmentedSrc)],
  theme: [source("chrome/theme-toggle/theme-toggle.tsx", themeToggleSrc)],
  density: [source("chrome/density-toggle/density-toggle.tsx", densityToggleSrc)],
} satisfies Record<string, readonly Source[]>;

export function ChromeSection() {
  const [range, setRange] = createSignal("24h");

  return (
    <Section
      id="chrome"
      title="Chrome"
      blurb="The product's own furniture: its name, and the controls over how the whole application is displayed. The test for belonging here is whether a different product using this template would replace it rather than reuse it — the mark yes, a button no."
    >
      <Case title="Mark" note="the name, in one place" sources={src.mark}>
        <Row label="sizes">
          <Flex gap={6} align="center">
            <Mark size="sm" />
            <Mark size="md" />
          </Flex>
        </Row>
        <Row label="as a link">
          <Mark href="/" />
        </Row>
        <Row label="renamed">
          <Mark name="Northgate" />
        </Row>
        <p class={s.caseNote}>
          <code>PRODUCT_NAME</code> is exported and used as the default, so renaming the
          product is one line. A template that scattered the name across a header, a title, an
          empty state and a footer would make the rename a search — which always misses one.
        </p>
        <p class={s.caseNote}>
          As a link its accessible name becomes{" "}
          <code>"{PRODUCT_NAME}, home"</code>, not just the word. The convention that a logo
          goes home is learned by sighted users from <strong>position</strong>, which a reader
          does not have — announced as "{PRODUCT_NAME}" it is a link to a word.
        </p>
        <p class={s.caseNote}>
          The glyph is drawn from tokens rather than shipped as a file. A template has no logo,
          and a placeholder image is one more thing to find and replace; a square from the
          accent token is honest about being a placeholder.
        </p>
      </Case>

      <Case title="Theme and density" note="three states, and two" sources={src.theme}>
        <Row label="live">
          <Flex gap={6} align="flex-end">
            <ThemeToggle />
            <DensityToggle />
          </Flex>
        </Row>
        <p class={s.caseNote}>
          These are the same controls in the header — and they stay in step with it, because
          none of them holds the answer. <code>lib/runtime</code> owns the stores; these read
          and call. The preference persists across reloads for the same reason.
        </p>
        <p class={s.caseNote}>
          <strong><code>system</code> is a choice, not the absence of one.</strong> A two-state
          toggle cannot express "follow the OS": once a user presses anything they are pinned
          to a value, and the product stops following the platform's own light/dark switch —
          a behaviour they chose at the OS level and did not intend to give up by touching a
          toggle once.
        </p>
        <p class={s.caseNote}>
          On the DOM side that is why <code>system</code> is the <em>absence</em> of{" "}
          <code>data-theme</code> rather than <code>data-theme="system"</code>: the
          stylesheet's <code>prefers-color-scheme</code> query is the fallback, and it only
          applies when nothing has overridden it.
        </p>
        <p class={s.caseNote}>
          Density has no <code>system</code>, and that is not an oversight — the OS has no
          opinion about how tight a table should be, so two is the honest count. A third to
          match the theme control would be symmetry for its own sake.
        </p>
      </Case>

      <Case title="Segmented" note="radios, not toggle buttons" sources={src.segmented}>
        <Row label="generic">
          <Segmented
            label="Range"
            value={range()}
            onChange={setRange}
            options={[
              { value: "1h", label: "1h" },
              { value: "24h", label: "24h" },
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
            ]}
          />
        </Row>
        <Row label="label hidden">
          <Segmented
            label="Range" labelHidden value={range()} onChange={setRange}
            options={[{ value: "1h", label: "1h" }, { value: "24h", label: "24h" }]}
          />
        </Row>
        <Row label="selected">
          <Text tone="muted">value: <code>{range()}</code></Text>
        </Row>

        <p class={s.caseNote}>
          The tempting implementation is a row of buttons with{" "}
          <code>aria-pressed</code>, one of them true. It looks identical and says something
          different: each is announced as its own two-state control, with nothing stating that
          they are alternatives, that exactly one is chosen, or how many there are. Radio
          semantics say all three — arrow through it and hear "2 of 4".
        </p>
        <p class={s.caseNote}>
          It applies on press, so it is <strong>not</strong> a form field. If the choice needs
          a Save it is a <code>RadioGroup</code> in a form — the same distinction the switch
          and the checkbox make over in Forms.
        </p>
        <p class={s.caseNote}>
          The focus ring sits on the item via <code>:has(:focus-visible)</code>, because the
          real input is visually hidden and its own ring would be invisible — the control
          would be operable and show nothing.
        </p>
      </Case>
    </Section>
  );
}
