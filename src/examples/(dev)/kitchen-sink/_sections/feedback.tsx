import { Avatar, Panel } from "~/components/display";
import { Alert, Skeleton, SkeletonText } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Box, Flex } from "~/components/layout";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { ProgressCase } from "./additional-controls";
import { DismissibleAlert } from "./dismissible-alert";
export function FeedbackSection() {
  return (
    <Section
      id="feedback"
      title="Feedback"
      blurb="Messages about the page rather than about a field — a field's error belongs to its Field, which owns the wiring that connects it to a control. Both of these make the same call twice: what a reader is told, and when."
    >
      <Case
        title="Alert"
        note="live is absent by default, because most alerts are rendered with the page"
      >
        <Row label="tones">
          <Box class={s.fullWidth}>
            <Flex direction="column" gap={4}>
              <Alert tone="info" title="Fixtures are answering">
                No backend is configured, so every domain is served from the
                route table.
              </Alert>
              <Alert
                tone="warn"
                title="Rate limited"
                action={<Button size="sm">Retry</Button>}
              >
                Too many requests. The server asked for 12 seconds.
              </Alert>
              <Alert tone="crit" title="Your session expired" live="assertive">
                Sign in again to continue.
              </Alert>
              <DismissibleAlert />
            </Flex>
          </Box>
        </Row>

        <p class={s.limits}>
          A live region announces its contents when they <strong>change</strong>
          . Most alerts are rendered with the page, so a live role announces
          nothing at load — and then spends the role announcing every later
          re-render as though it were news. Absent by default;{" "}
          <code>polite</code> waits for the reader to finish its sentence;{" "}
          <code>assertive</code> interrupts.
        </p>
        <p class={s.limits}>
          The dismissible one is a <strong>client</strong> component, because a
          function prop cannot cross the server boundary. That is the same rule
          the button&rsquo;s contract is built around, and the reason no
          primitive here manufactures a handler: one that always attached an{" "}
          <code>onClick</code> would be silently client-only and take every page
          rendering it along.
        </p>
        <p class={s.limits}>
          <strong>Be careful with assertive.</strong> It cuts a reader off
          mid-sentence, and a page that does that for a saved-successfully
          message has taught its user to resent it. The rule of thumb: if a
          sighted user would not be shown a modal, it is not assertive.
        </p>
      </Case>

      <Case
        title="Skeleton"
        note="hidden from readers, and sized to what is coming"
      >
        <Row label="text">
          <Box class={s.fullWidth}>
            <SkeletonText lines={3} />
          </Box>
        </Row>
        <Row label="a shape">
          <Panel title="Targets">
            <div aria-busy="true">
              <Flex gap={5} align="center" py={2}>
                <Skeleton circle width="28px" />
                <Box class={s.fullWidth}>
                  <SkeletonText lines={2} />
                </Box>
              </Flex>
            </div>
          </Panel>
        </Row>
        <Row label="what it becomes">
          <Panel title="Targets">
            <Flex gap={5} align="center" py={2}>
              <Avatar name="Ada Lovelace" />
              <div>
                <div>api.example.com</div>
                <div class={s.quiet}>Owned by Ada Lovelace</div>
              </div>
            </Flex>
          </Panel>
        </Row>

        <p class={s.limits}>
          Every placeholder is <code>aria-hidden</code>. A reader hearing
          &ldquo;loading&rdquo; ten times from ten skeletons is worse off than
          one hearing nothing — the busy state goes on the{" "}
          <strong>region</strong>, as <code>aria-busy</code>, which is one
          announcement instead of ten.
        </p>
        <p class={s.limits}>
          <strong>A generic grey box is a spinner with extra steps.</strong> The
          value of a skeleton is that the layout does not move when the content
          lands, which requires it to be the shape of the content — hence the
          two panels above. The last text line is short because real paragraphs
          end mid-line; a block of equal bars reads as a table.
        </p>
        <p class={s.limits}>
          The reset flattens animation under a reduced-motion preference, so the
          shimmer stops. What remains is the colour difference, which is what
          says &ldquo;not yet&rdquo; — a skeleton that needs movement to be
          legible has put its message in the one channel some people switched
          off.
        </p>
      </Case>
      <ProgressCase />
    </Section>
  );
}
