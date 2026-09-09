import { For } from "solid-js";
import {
  Avatar, Badge, Empty, Mock, Panel, Presence, Stat,
  TBody, THead, Table, Td, Th, Tr,
} from "~/components/display";
import { Button } from "~/components/forms";
import { notFound } from "~/lib/kernel";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import avatarSrc from "~/components/display/avatar/avatar.tsx?raw";
import badgeSrc from "~/components/display/badge/badge.tsx?raw";
import badgeVariantsSrc from "~/components/display/badge/badge.variants.ts?raw";
import emptySrc from "~/components/display/empty/empty.tsx?raw";
import mockSrc from "~/components/display/mock/mock.tsx?raw";
import panelSrc from "~/components/display/panel/panel.tsx?raw";
import presenceSrc from "~/components/display/presence/presence.tsx?raw";
import statSrc from "~/components/display/stat/stat.tsx?raw";
import tableSrc from "~/components/display/table/table.tsx?raw";

const src = {
  panel: [source("display/panel/panel.tsx", panelSrc)],
  badge: [
    source("display/badge/badge.tsx", badgeSrc),
    source("display/badge/badge.variants.ts", badgeVariantsSrc),
  ],
  avatar: [source("display/avatar/avatar.tsx", avatarSrc)],
  stat: [source("display/stat/stat.tsx", statSrc)],
  empty: [source("display/empty/empty.tsx", emptySrc)],
  mock: [source("display/mock/mock.tsx", mockSrc)],
  presence: [source("display/presence/presence.tsx", presenceSrc)],
  table: [source("display/table/table.tsx", tableSrc)],
} satisfies Record<string, readonly Source[]>;

const TONES = ["neutral", "accent", "info", "warn", "crit"] as const;

const ROWS = [
  { site: "EU-West", cameras: 12, offline: 0 },
  { site: "US-East", cameras: 148, offline: 3 },
  { site: "AP-South", cameras: 7, offline: 7 },
];

export function DisplaySection() {
  return (
    <Section
      id="display"
      title="Display"
      blurb="Eight primitives that show something. The argument running through them is that a state has to be ANNOUNCED and not merely drawn — an unmeasured figure, an emptiness, a disclaimer and a table's headers all fail silently when they are only a colour or a shape."
    >
      <Case title="Panel" note="title · actions · flush" sources={src.panel}>
        <Row label="titled">
          <Panel title="Cameras" actions={<Button size="sm" intent="ghost">Refresh</Button>}>
            <p class={s.caseNote}>A panel is a named region — it appears in the regions list and can be jumped to.</p>
          </Panel>
        </Row>
        <Row label="untitled">
          <Panel><p class={s.caseNote}>No title, so no name, so deliberately not a landmark.</p></Panel>
        </Row>
        <Row label="flush">
          <Panel title="Sites" flush>
            <Table caption="Cameras by site">
              <THead><Tr><Th>Site</Th><Th numeric>Cameras</Th></Tr></THead>
              <TBody>
                <For each={ROWS}>{(r) => <Tr><Td>{r.site}</Td><Td numeric>{r.cameras}</Td></Tr>}</For>
              </TBody>
            </Table>
          </Panel>
        </Row>
        <p class={s.caseNote}>
          The title is an <code>h2</code> and the section is wired to it with{" "}
          <code>aria-labelledby</code>. Without a title the attribute is absent rather than
          empty — a <code>section</code> with no accessible name is announced as an unnamed
          region, which is worse than not being a landmark at all.
        </p>
        <p class={s.caseNote}>
          <code>flush</code> removes the body padding for a child that draws its own edges.
          Note that the header keeps its rule: if the body owned that border, a flush panel
          would lose the line between its title and its content at the moment it needs it.
        </p>
      </Case>

      <Case title="Badge" note="tone · solid · glyph" sources={src.badge}>
        <Row label="tone">
          <For each={TONES}>{(tone) => <Badge tone={tone}>{tone}</Badge>}</For>
        </Row>
        <Row label="solid">
          <For each={TONES}>{(tone) => <Badge tone={tone} solid>{tone}</Badge>}</For>
        </Row>
        <Row label="glyph">
          <Badge tone="crit" glyph="!">Failing</Badge>
          <Badge tone="accent" glyph="✓">Accepted</Badge>
          <Badge tone="warn" glyph="!">Degraded</Badge>
        </Row>
        <p class={s.caseNote}>
          The tones are named for <strong>meaning</strong>, never for colour — <code>crit</code>{" "}
          survives a palette change and <code>red</code> becomes a lie at that moment. The text
          is mandatory and the hue is redundant with it, because hue is the channel that fails
          quietly: colour vision, a projector, a greyscale print.
        </p>
        <p class={s.caseNote}>
          Outline reads as a category, solid as a condition. Two badge columns in the same
          weight make the reader work out which is which on every row.
        </p>
      </Case>

      <Case title="Avatar" note="name required · initials · fallback" sources={src.avatar}>
        <Row label="size">
          <Avatar size="sm" name="Ada Lovelace" />
          <Avatar size="md" name="Ada Lovelace" />
        </Row>
        <Row label="initials">
          <Avatar name="Ada Lovelace" />
          <Avatar name="Ada Byron King" />
          <Avatar name="Ada" />
          <Avatar name="grace hopper" />
        </Row>
        <Row label="broken src">
          <Avatar name="Ada Lovelace" src="/does-not-exist.png" />
        </Row>
        <p class={s.caseNote}>
          <code>name</code> is required even when an image is present: it is the fallback's
          content and the image's alternative text. A broken <code>src</code> falls back to the
          initials rather than the browser's broken-image glyph, which would say{" "}
          <em>this page is broken</em> about a person.
        </p>
        <p class={s.caseNote}>
          The whole thing is one <code>role="img"</code> with the full name — otherwise the
          initials are announced as loose letters beside a name that is already in the text.
          Initials take the first and last word, sliced by code point so an astral character is
          not cut in half.
        </p>
      </Case>

      <Case title="Stat" note="the third state" sources={src.stat}>
        <Row label="measured">
          <Stat label="Cameras" value={148} />
          <Stat label="Offline" value={0} />
          <Stat label="Retention" value="1 year" hint="Applies to every stream" />
        </Row>
        <Row label="unmeasured">
          <Stat label="Throughput" />
          <Stat label="Uptime" hint="The site did not answer" />
        </Row>
        <p class={s.caseNote}>
          <strong>Zero is a measurement; the dash is the absence of one.</strong> A screen that
          prints <code>0</code> for a request that failed has invented a reassuring fact at the
          moment it had none — the <code>value ?? 0</code> that does it usually sits three tiers
          up.
        </p>
        <p class={s.caseNote}>
          The en dash is <code>aria-hidden</code> and the words "not measured" are announced
          instead, because a dash is silent: the one user who most needs telling that a figure
          is missing is the one who would not be told.
        </p>
      </Case>

      <Case title="Presence" note="all three states, none skippable" sources={src.presence}>
        <Row label="found">
          <Presence of={{ state: "found", value: "148 cameras" }} empty="No cameras at this site.">
            {(v) => <span>{v}</span>}
          </Presence>
        </Row>
        <Row label="empty">
          <Presence of={{ state: "empty" }} empty="No cameras at this site.">
            {(v) => <span>{String(v)}</span>}
          </Presence>
        </Row>
        <Row label="unmeasured">
          <Presence of={{ state: "unmeasured", failure: notFound("GET /sites/9 404") }} empty="No cameras at this site.">
            {(v) => <span>{String(v)}</span>}
          </Presence>
        </Row>
        <p class={s.caseNote}>
          The render half of <code>lib/kernel</code>'s three states. <code>empty</code> is a{" "}
          <strong>required</strong> prop: every default that could be written is wrong, because
          "No data" is the same sentence on every screen and a person who landed on the wrong
          one cannot tell.
        </p>
        <p class={s.caseNote}>
          The unmeasured branch never prints the failure's <code>message</code> — that is
          diagnostic, written for whoever reads the logs, in someone else's voice and often
          someone else's language. The failure is handed to an optional callback so the product
          can switch on <code>kind</code> and say something in its own words.
        </p>
      </Case>

      <Case title="Empty" note="looked, and found nothing" sources={src.empty}>
        <Row label="plain">
          <Panel title="Cameras" flush>
            <Empty title="No cameras yet" body="Cameras added to this site will appear here." />
          </Panel>
        </Row>
        <Row label="with an action">
          <Panel title="Cameras" flush>
            <Empty
              title="No cameras yet"
              body="Cameras added to this site will appear here."
              action={<Button intent="primary" size="sm">Add a camera</Button>}
            />
          </Panel>
        </Row>
        <p class={s.caseNote}>
          "No cameras yet" tells you what is missing and implies where you are. "No data" tells
          you a container is empty, which the blank space already said, and reads identically on
          every screen. The title is a <code>string</code> rather than a slot for that reason.
        </p>
        <p class={s.caseNote}>
          <code>action</code> is optional because sometimes there is nothing to do — a filter
          that matched nothing has no fix, and inventing a Refresh button gives the user
          something to press that changes nothing.
        </p>
      </Case>

      <Case title="Mock" note="deliberately ugly" sources={src.mock}>
        <Row label="default">
          <Mock>
            <Stat label="Throughput" value="1.4 Gb/s" />
          </Mock>
        </Row>
        <Row label="with a note">
          <Mock note="Sample readings — not from this site">
            <Stat label="Peak" value="2.1 Gb/s" />
          </Mock>
        </Row>
        <p class={s.caseNote}>
          This is the one place the system is intentionally ugly. A tasteful marker can be
          mistaken for a design decision, and a mock that looks intentional is a mock that
          ships — into a screenshot, into a deck, where nobody remembers the numbers were
          invented.
        </p>
        <p class={s.caseNote}>
          The disclaimer is announced <strong>before</strong> the content, because a reader
          meets children in order and a note placed after the figures arrives once they have
          been believed. It carries <code>data-mock</code> so a release check can assert a
          production page has none — enforcement is available and is not the component's to
          impose.
        </p>
      </Case>

      <Case title="Table" note="scope · numeric · scrollable" sources={src.table}>
        <Row label="table">
          <Table caption="Cameras by site">
            <THead>
              <Tr><Th scope="col">Site</Th><Th numeric>Cameras</Th><Th numeric>Offline</Th></Tr>
            </THead>
            <TBody>
              <For each={ROWS}>
                {(r) => (
                  <Tr>
                    <Th scope="row">{r.site}</Th>
                    <Td numeric>{r.cameras}</Td>
                    <Td numeric>{r.offline === 0 ? <Badge>none</Badge> : <Badge tone="crit" glyph="!">{r.offline}</Badge>}</Td>
                  </Tr>
                )}
              </For>
            </TBody>
          </Table>
        </Row>
        <p class={s.caseNote}>
          Real table elements, because they carry a navigation model divs do not: a reader moves
          cell by cell and hears the relevant header with each value — "Site, EU-West; Cameras,
          12" — so a cell in the middle of a wide table is intelligible on its own.
        </p>
        <p class={s.caseNote}>
          Every <code>th</code> carries a <code>scope</code>, defaulting to the column, because
          an ambiguous header is worse than a missing one. The scroll wrapper is a separate,
          focusable <code>region</code> named by the caption — a scrollable area that cannot be
          focused leaves every column past the fold unreachable without a pointer.
        </p>
      </Case>
    </Section>
  );
}
