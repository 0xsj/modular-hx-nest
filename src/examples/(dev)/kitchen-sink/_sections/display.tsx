import {
  Avatar,
  Badge,
  DescriptionItem,
  DescriptionList,
  Empty,
  Mock,
  Panel,
  Presence,
  Stat,
} from "~/components/display";
import { Button } from "~/components/forms";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";

/* One case per component, so the rail is a catalog: anything in the group can
   be found by its own name. Two components share a case only where neither can
   be shown without the other. */

export function DisplaySection() {
  return (
    <Section
      id="display"
      title="Display"
      blurb="What a screen shows when it is not asking for anything — and where the three-states rule is most often lost. Three of these exist to make that loss hard: Presence renders the distinction, Stat refuses to print 0 for something nobody measured, and Empty is styled as the successful answer it is."
    >
      <Case
        title="Panel"
        note="a bounded region with a name — the frame most screens are made of"
      >
        <div class={s.fieldGrid}>
          <Panel
            title="Targets"
            actions={
              <Badge glyph="●" tone="accent">
                healthy
              </Badge>
            }
          >
            A panel with a heading and its own controls.
          </Panel>
          <Panel>Untitled — no header row is rendered at all.</Panel>
        </div>
        <p class={s.limits}>
          <code>flush</code> removes the body padding for a child that owns its
          own edges: a table, a chart, a list drawing its own dividers.
        </p>
      </Case>

      <Case
        title="Description list"
        note="structured label-value pairs, with any component as a value"
      >
        <DescriptionList>
          <DescriptionItem term="Workspace">Northstar</DescriptionItem>
          <DescriptionItem term="Owner">
            <span class={s.choice}>
              <Avatar name="Ada Lovelace" size="sm" />
              Ada Lovelace
            </span>
          </DescriptionItem>
          <DescriptionItem term="Status">
            <Badge glyph="●" tone="accent">
              Active
            </Badge>
          </DescriptionItem>
          <DescriptionItem term="Description">
            A shared space for projects and their collaborators. Longer values
            wrap and stack below the label on narrow screens.
          </DescriptionItem>
        </DescriptionList>
      </Case>

      <Case title="Stat" note="undefined renders as – and never as 0">
        <Row label="measured">
          <div class={s.statRow}>
            <Stat label="Targets" value={12} />
            <Stat label="Findings" value={0} hint="measured, and it is zero" />
          </div>
        </Row>
        <Row label="unmeasured">
          <div class={s.statRow}>
            <Stat label="Coverage" hint="nobody has run this yet" />
          </div>
        </Row>
      </Case>

      <Case
        title="Presence"
        note="found · looked and found nothing · never checked"
      >
        <Row label="found">
          <Presence
            of={{
              state: "found",
              value: "nginx/1.24",
            }}
          >
            {(v) => <span>{v}</span>}
          </Presence>
        </Row>
        <Row label="empty">
          <Presence
            of={{
              state: "empty",
            }}
          >
            {(v: string) => v}
          </Presence>
        </Row>
        <Row label="unmeasured">
          <Presence
            of={{
              state: "unmeasured",
              failure: {
                kind: "timeout",
                message: "Timed out.",
              },
            }}
          >
            {(v: string) => v}
          </Presence>
        </Row>
        <p class={s.limits}>
          The two absent states must not look alike, or the component has thrown
          away the distinction it exists to keep. Each carries its own title
          saying which it is — and <code>PRESENCE_MEANING</code> is defined
          once, so a cell, a legend and a screen reader cannot describe it three
          different ways.
        </p>
      </Case>

      <Case title="Badge" note="a status, never colour alone">
        <Row label="tones">
          <Badge glyph="●" tone="accent">
            healthy
          </Badge>
          <Badge glyph="▲" tone="warn">
            degraded
          </Badge>
          <Badge glyph="✕" tone="crit">
            failed
          </Badge>
          <Badge glyph="›" tone="info">
            queued
          </Badge>
          <Badge glyph="··">never checked</Badge>
        </Row>
        <p class={s.limits}>
          A glyph beside the hue and a word inside it, so the badge survives
          greyscale, a projector, and a reader who cannot distinguish the
          colours. The glyph is <code>aria-hidden</code> — the text is the
          announcement.
        </p>
      </Case>

      <Case title="Empty" note="a successful answer, styled as one">
        <Panel title="Targets">
          <Empty
            title="No targets yet."
            body="A target is something you have asked a tool to look at. Add one and its findings will appear here."
            action={
              <Button intent="primary" size="sm">
                Add a target
              </Button>
            }
          />
        </Panel>
        <p class={s.limits}>
          Deliberately not error styling. An empty list is a request that{" "}
          <strong>worked</strong>, and rendering it in red teaches people to
          read a working system as broken. It also says what is absent — “No
          targets yet”, not “No data”.
        </p>
      </Case>

      <Case
        title="Avatar"
        note="a person, with a fallback that is not a broken image"
      >
        <Row label="fallback">
          <span class={s.choice}>
            <Avatar name="Ada Lovelace" /> Ada Lovelace
          </span>
          <span class={s.choice}>
            <Avatar name="Grace Hopper" size="sm" /> Grace Hopper
          </span>
        </Row>
        <p class={s.limits}>
          <code>name</code> is required even when an image is given: it is the
          fallback&rsquo;s content and the image&rsquo;s alternative text. An
          avatar with neither is a decorative circle claiming to identify
          somebody.
        </p>
      </Case>

      <Case title="Mock" note="a visible mark that this is not a record">
        <Row label="default">
          <Mock />
        </Row>
        <Row label="specific">
          <Mock note="Fixture data — the backend does not serve this yet." />
        </Row>
        <p class={s.limits}>
          Announced rather than decorative: somebody who cannot see the badge is
          exactly the person most likely to quote a fixture back at you as fact.
        </p>
      </Case>
    </Section>
  );
}
