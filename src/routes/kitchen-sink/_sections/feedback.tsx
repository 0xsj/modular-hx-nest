import { For, createSignal } from "solid-js";
import { Alert, Skeleton, SkeletonText } from "~/components/feedback";
import { Panel, Stat } from "~/components/display";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import alertSrc from "~/components/feedback/alert/alert.tsx?raw";
import alertVariantsSrc from "~/components/feedback/alert/alert.variants.ts?raw";
import skeletonSrc from "~/components/feedback/skeleton/skeleton.tsx?raw";

const src = {
  alert: [
    source("feedback/alert/alert.tsx", alertSrc),
    source("feedback/alert/alert.variants.ts", alertVariantsSrc),
  ],
  skeleton: [source("feedback/skeleton/skeleton.tsx", skeletonSrc)],
} satisfies Record<string, readonly Source[]>;

const TONES = ["neutral", "accent", "info", "warn", "crit"] as const;

export function FeedbackSection() {
  const [dismissed, setDismissed] = createSignal(false);
  /* The container is mounted always and filled later, which is the point the
     case below is making — not `{live && <Alert live=…>}`. */
  const [arrived, setArrived] = createSignal<string | null>(null);

  return (
    <Section
      id="feedback"
      title="Feedback"
      blurb="Two primitives about what the system is doing. Both turn on a distinction that is invisible in a screenshot: an alert that ARRIVED is not the same as one that was always there, and a skeleton is a picture of content rather than a statement that content is coming."
    >
      <Case title="Alert" note="tone · title · action · dismiss" sources={src.alert}>
        <Row label="tone">
          <Flex direction="column" gap={3} style={{ "inline-size": "100%" }}>
            <For each={TONES}>
              {(tone) => (
                <Alert tone={tone}>
                  {tone === "crit"
                    ? "The card issuer declined this payment."
                    : tone === "warn"
                      ? "This site is at 92% of its retention budget."
                      : tone === "accent"
                        ? "Your export finished and is ready to download."
                        : tone === "info"
                          ? "Retention changes take effect at the next cycle."
                          : "Nothing here needs your attention."}
                </Alert>
              )}
            </For>
          </Flex>
        </Row>

        <Row label="title and action">
          <Alert
            tone="crit"
            title="Payment failed"
            action={<><Button size="sm" intent="primary">Update card</Button><Button size="sm" intent="ghost">Dismiss</Button></>}
          >
            The card issuer declined this payment. Nothing has been charged.
          </Alert>
        </Row>

        <Row label="dismissible">
          <Alert
            tone="info"
            onDismiss={() => setDismissed(true)}
            dismissLabel="Hide this notice"
          >
            {dismissed() ? "The handler ran — and this is still here." : "Press the ✕."}
          </Alert>
        </Row>

        <p class={s.caseNote}>
          The component does <strong>not</strong> hide itself. Visibility is the caller's
          state, and a primitive that removes itself has taken a decision its caller cannot
          undo — an alert that vanishes is unrecoverable. It never manufactures the handler
          either, so with no <code>onDismiss</code> there is no button at all.
        </p>
        <p class={s.caseNote}>
          Tone is not carried by colour alone: each has a glyph, and{" "}
          <code>warn</code> and <code>crit</code> add a visually-hidden word — "Warning",
          "Error" — because those are the two where missing the distinction changes what you
          do. <code>info</code> gets none; "Info: your export is ready" is a syllable and no
          fact. The body text is never tinted, because red copy is harder to read and the
          border, fill and glyph have already said which tone this is.
        </p>
      </Case>

      <Case title="Alert · live regions" note="the trap" sources={src.alert}>
        <Row label="arriving">
          {/* Mounted empty on purpose. */}
          <div role="status" class={s.caseNote} style={{ "min-block-size": "1.5em" }}>
            {arrived()}
          </div>
        </Row>
        <Row label="">
          <Button size="sm" onClick={() => setArrived(`Export ready at ${new Date().toLocaleTimeString()}.`)}>
            Make something arrive
          </Button>
          <Button size="sm" intent="ghost" onClick={() => setArrived(null)}>Reset</Button>
        </Row>

        <p class={s.caseNote}>
          <code>live</code> is <strong>absent by default</strong>. A live region is a promise
          that its contents are new, and most alerts render with the page — an always-present
          assertive region trains a user to ignore the one that matters, and a polite one that
          was there at load announces nothing anyway.
        </p>
        <p class={s.caseNote}>
          The trap is that <strong>a live region must exist before the thing it
          announces</strong>. Assistive technology watches regions already in the tree, so{" "}
          <code>{"{error && <Alert live=\"assertive\">…</Alert>}"}</code> — the obvious
          spelling — often announces nothing, because there was nothing to watch when the
          change happened. The region above is mounted empty and filled on press, which is the
          shape that works. Where the region lives is a screen's decision, so the component
          carries the role and does not pretend to solve it.
        </p>
        <p class={s.caseNote}>
          It sets the <code>role</code> rather than <code>aria-live</code>:{" "}
          <code>alert</code> and <code>status</code> each imply their politeness{" "}
          <em>and</em> <code>aria-atomic</code>. The atomic half is what people miss reaching
          for <code>aria-live</code> alone — without it a reader announces the diff, so a
          changed word arrives with no sentence around it.
        </p>
      </Case>

      <Case title="Skeleton" note="decorative, and not a loading state" sources={src.skeleton}>
        <Row label="shapes">
          <Flex gap={4} align="center" style={{ "inline-size": "100%" }}>
            <Skeleton circle width="28px" />
            <Skeleton width="140px" height="12px" />
            <Skeleton height="32px" />
          </Flex>
        </Row>

        <Row label="text">
          <div style={{ "inline-size": "320px" }}><SkeletonText lines={3} /></div>
        </Row>

        <Row label="in place">
          {/* aria-busy is the caller's job, and this is what doing it looks like. */}
          <Panel title="Cameras">
            <div aria-busy="true">
              <Flex direction="column" gap={4}>
                <Flex gap={4}>
                  <Stat label="Cameras" value={148} />
                  <Skeleton width="80px" height="28px" />
                </Flex>
                <SkeletonText lines={2} />
              </Flex>
            </div>
          </Panel>
        </Row>

        <p class={s.caseNote}>
          A skeleton is <code>aria-hidden</code> — it is a picture of a paragraph, and reading
          "blank blank blank" to somebody is worse than reading nothing. The consequence is the
          part worth stating: <strong>a screen full of skeletons announces nothing at
          all.</strong> A reader is told the page is loaded, finds no content, and cannot tell
          whether to wait or leave.
        </p>
        <p class={s.caseNote}>
          So the caller must also say what is happening — <code>aria-busy</code> on the region
          being replaced, as above, or a live region, or a visible label. The component
          deliberately does not choose, because building one in would make the wrong one
          automatic and the failure would be silent.
        </p>
        <p class={s.caseNote}>
          Loading is <strong>not</strong> the third state. "Still waiting" and "came back with
          nothing" are different facts, and so are "waiting" and "the request failed" — a
          skeleton still on screen after a failure is the page that loads forever. The last
          line of a text block is short because real paragraphs end mid-line; a stack of equal
          bars reads as a table.
        </p>
        <p class={s.caseNote}>
          Under <code>prefers-reduced-motion</code> the sweep stops entirely rather than
          shortening. An indefinite animation is the one kind that cannot be waited out, and a
          zero-duration animation repeated forever is a bug rather than a stillness.
        </p>
      </Case>
    </Section>
  );
}
