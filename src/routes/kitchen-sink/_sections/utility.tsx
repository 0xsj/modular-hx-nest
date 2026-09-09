import { Badge } from "~/components/display";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import {
  AccessibleIcon, Check, ChevronDown, Info, Minus, Portal, TriangleAlert,
  VisuallyHidden, X,
} from "~/components/utility";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import accessibleIconSrc from "~/components/utility/accessible-icon/accessible-icon.tsx?raw";
import iconSrc from "~/components/utility/icon/icon.ts?raw";
import portalSrc from "~/components/utility/portal/portal.tsx?raw";
import visuallyHiddenSrc from "~/components/utility/visually-hidden/visually-hidden.tsx?raw";

const src = {
  icon: [source("utility/icon/icon.ts", iconSrc)],
  visuallyHidden: [source("utility/visually-hidden/visually-hidden.tsx", visuallyHiddenSrc)],
  accessibleIcon: [source("utility/accessible-icon/accessible-icon.tsx", accessibleIconSrc)],
  portal: [source("utility/portal/portal.tsx", portalSrc)],
} satisfies Record<string, readonly Source[]>;

const ICONS = [
  { name: "Check", El: Check },
  { name: "ChevronDown", El: ChevronDown },
  { name: "Minus", El: Minus },
  { name: "X", El: X },
  { name: "TriangleAlert", El: TriangleAlert },
  { name: "Info", El: Info },
];

export function UtilitySection() {
  return (
    <Section
      id="utility"
      title="Utility"
      blurb="Four seams with no appearance of their own. Each exists so a rule has one place to live — the icon set stays countable, hidden text stays in the accessibility tree, a meaningful glyph gets words, and a portal keeps its owner while moving its box."
    >
      <Case title="Icon" note="the whole set, in one file" sources={src.icon}>
        <Row label="in use">
          <Flex gap={5} align="center">
            {ICONS.map(({ name, El }) => (
              <Flex direction="column" align="center" gap={2}>
                <El size={16} aria-hidden="true" />
                <code class={s.caseNote}>{name}</code>
              </Flex>
            ))}
          </Flex>
        </Row>
        <p class={s.caseNote}>
          Six of the library's two thousand. The list is a{" "}
          <strong>declaration of the surface</strong>, which <code>export *</code> would not
          be, and adding a line is the moment somebody asks whether the set already has one
          that means this.
        </p>
        <p class={s.caseNote}>
          Subpath imports rather than the barrel: both tree-shake in a production build, but
          the barrel pulls 2,077 modules into the dev server's graph and the subpath form pulls
          exactly these. The set is named in <code>icon.ts</code> and the barrels above it
          forward — three copies of a list is not a countable surface, it is three lists that
          drift.
        </p>
      </Case>

      <Case title="VisuallyHidden" note="for the reader, not the screen" sources={src.visuallyHidden}>
        <Row label="try it">
          <Text>
            There is a hidden word after this sentence.
            <VisuallyHidden> — and this is it, announced but not drawn.</VisuallyHidden>
          </Text>
        </Row>
        <p class={s.caseNote}>
          Every simpler way of hiding is wrong: <code>display: none</code>,{" "}
          <code>visibility: hidden</code> and the <code>hidden</code> attribute all remove the
          text from the accessibility tree, which is the exact opposite of the intent. What is
          left is to render normally and clip the box to nothing.
        </p>
        <p class={s.caseNote}>
          <code>white-space: nowrap</code> is the line people leave out — without it the text
          still wraps inside a 1px box and some readers announce it one word per line. Use it
          for a <strong>second</strong> channel, never a first: text that appears only here is
          a fact the sighted user never gets.
        </p>
      </Case>

      <Case title="AccessibleIcon" note="most icons should not use this" sources={src.accessibleIcon}>
        <Row label="decorative">
          <Badge tone="crit" glyph="!">Failing</Badge>
          <Text as="span" tone="muted">the glyph is hidden; the word already said it</Text>
        </Row>
        <Row label="meaningful">
          <Flex gap={2} align="center">
            <AccessibleIcon label="Degraded"><TriangleAlert size={15} /></AccessibleIcon>
            <AccessibleIcon label="Healthy"><Check size={15} /></AccessibleIcon>
            <Text as="span" tone="muted">a status cell with no text of its own</Text>
          </Flex>
        </Row>
        <p class={s.caseNote}>
          The question: <strong>if the icon were deleted, would anything be lost?</strong> No —
          hide it. Yes — it needs words. The label is what the icon <em>means</em>
          ("Degraded"), never what it depicts ("triangle with an exclamation mark") — the same
          mistake as alt text that says "photo of".
        </p>
        <p class={s.caseNote}>
          It hides the glyph and puts real text beside it rather than labelling the{" "}
          <code>svg</code>. An <code>aria-label</code> on an element with no role is ignored by
          some readers, and adding <code>role="img"</code> makes an inline icon a separate
          object announced mid-sentence.
        </p>
      </Case>

      <Case title="Portal" note="a re-export, on purpose" sources={src.portal}>
        <Row label="rendered here, mounted at the end of the document">
          <div class={s.demoEdge} style={{ padding: "var(--space-3)" }}>
            <Text tone="muted">This box's child is portalled out of it →</Text>
            <Portal>
              <div
                id="ks-portal-target"
                class={s.demoFill}
                style={{ position: "fixed", "inset-block-end": "var(--space-4)", "inset-inline-end": "var(--space-4)", "z-index": "var(--z-toast)" }}
              >
                portalled to the end of &lt;body&gt;
              </div>
            </Portal>
          </div>
        </Row>
        <p class={s.caseNote}>
          The box above appears only after hydration. <strong>A portal renders nothing
          during a server render</strong> — it needs a document to mount into and there is not
          one — so anything that must be present in the first paint, for a crawler, or without
          JavaScript must not live behind one.
        </p>
        <p class={s.caseNote}>
          It adds nothing today, and that is the point: the rule is that whatever wraps a
          third-party thing is the only thing that imports it, <em>including</em> the
          pass-throughs — a rule with no exceptions is the only kind that survives. The day a
          portal needs a default mount point or a CSP nonce there is one place to put it.
        </p>
        <p class={s.caseNote}>
          The DOM position and the component position are different questions. A dropdown
          belongs to the button that owns its state and must not be inside the{" "}
          <code>overflow: hidden</code> panel that button sits in — a clipped element cannot be
          un-clipped by stacking, so no <code>z-index</code> fixes it. Context, reactivity and
          cleanup all still follow the owner.
        </p>
        <p class={s.caseNote}>
          What it does not solve: <strong>focus order</strong>. A portalled element is at the
          end of the document, so Tab reaches it last wherever its trigger is — which is what
          focus management in the overlay primitives is for.
        </p>
      </Case>
    </Section>
  );
}
