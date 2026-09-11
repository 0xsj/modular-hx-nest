import { A as Link } from "@solidjs/router";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
  Stat,
} from "~/components/display";
import { Button } from "~/components/forms";
import { Text } from "~/components/typography";
import { ArrowUpRight } from "~/components/utility";
import { Case, Section } from "../_components/section";
import { readSources } from "../_lib/source";
import {
  CardStatesDemo,
  RecordCardsDemo,
  SelectionCardsDemo,
  SettingsCardsDemo,
} from "./card-demo";
import s from "./card-demo.module.css";
export function CardsSection() {
  const [structure, selection] = [
    readSources(["display/card/card.tsx", "display/card/doc.ts"]),
    readSources([
      "patterns/selection-card/selection-card.tsx",
      "patterns/selection-card/doc.ts",
    ]),
  ];
  return (
    <Section
      id="cards"
      title="Cards"
      blurb="Self-contained content, composed from a small set of parts. Explore records, metrics, settings, choices, and media with local example data."
    >
      <Case
        title="Card anatomy"
        note="optional parts; the content chooses the structure"
        sources={structure}
      >
        <div class={s.grid}>
          <Card aria-labelledby="simple-card-title">
            <CardBody>
              <CardTitle id="simple-card-title" level={3}>
                A quiet starting point
              </CardTitle>
              <CardDescription>
                A title and body are enough. Add sections as the content needs
                them.
              </CardDescription>
            </CardBody>
          </Card>
          <Card aria-labelledby="composed-card-title">
            <CardHeader
              actions={
                <Badge glyph="●" tone="accent">
                  New
                </Badge>
              }
            >
              <CardTitle id="composed-card-title" level={3}>
                A little more structure
              </CardTitle>
              <CardDescription>
                Context belongs beside the title.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <Text size="sm">
                Use the body for details and the footer for supporting
                information or a next step.
              </Text>
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                Ready to explore
              </Text>
              <Button
                asChild={(forwarded) => (
                  <Link {...forwarded()} href="/kitchen-sink/patterns">
                    View page patterns
                  </Link>
                )}
                size="sm"
              />
            </CardFooter>
          </Card>
        </div>
      </Case>
      <Case
        title="Record cards"
        note="a primary destination with independent secondary actions"
      >
        <RecordCardsDemo />
      </Case>
      <Case
        title="Metric cards"
        note="measured zero and unmeasured values stay distinct"
      >
        <div class={s.grid}>
          <Card aria-labelledby="audience-card-title">
            <CardHeader>
              <CardTitle id="audience-card-title" level={3}>
                Audience
              </CardTitle>
              <CardDescription>Last seven days</CardDescription>
            </CardHeader>
            <CardBody>
              <Stat label="Active users" value="12,840" />
              <WeeklyTrend />
              <Text size="sm" tone="accent">
                ↑ 12% above the previous period
              </Text>
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                Illustrative daily totals
              </Text>
              <Link class={s.textLink} href="/kitchen-sink/charts">
                Explore charts <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </CardFooter>
          </Card>
          <Card aria-labelledby="incidents-card-title">
            <CardHeader>
              <CardTitle id="incidents-card-title" level={3}>
                Reliability
              </CardTitle>
              <CardDescription>Current workspace</CardDescription>
            </CardHeader>
            <CardBody>
              <Stat
                label="Open incidents"
                value={0}
                hint="Checked just now; no open incidents."
              />
              <Badge class={s.badge} glyph="✓" tone="accent">
                All clear
              </Badge>
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                A measured zero
              </Text>
            </CardFooter>
          </Card>
          <Card aria-labelledby="latency-card-title">
            <CardHeader>
              <CardTitle id="latency-card-title" level={3}>
                Performance
              </CardTitle>
              <CardDescription>
                Waiting for the first measurement
              </CardDescription>
            </CardHeader>
            <CardBody>
              <Stat
                label="Median response time"
                hint="Connect a data source to begin measuring."
              />
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                No measurement available
              </Text>
            </CardFooter>
          </Card>
        </div>
      </Case>
      <Case
        title="Settings cards"
        note="descriptions beside controls; state belongs to the screen"
      >
        <SettingsCardsDemo />
      </Case>
      <Case
        title="Selectable cards"
        note="radio choices, independent checkboxes, and a disabled option"
        sources={selection}
      >
        <SelectionCardsDemo />
      </Case>
      <Case
        title="Media cards"
        note="a media slot, readable content, and a real link"
      >
        <div class={s.grid}>
          <Card aria-labelledby="workspace-card-title">
            <CardMedia>
              <WorkspaceCover />
            </CardMedia>
            <CardHeader>
              <Text as="span" size="sm" tone="muted">
                Template · 5 minute read
              </Text>
              <CardTitle id="workspace-card-title" level={3}>
                <CardLink
                  asChild={(forwarded) => (
                    <Link {...forwarded()} href="/kitchen-sink/shells">
                      A workspace that grows with you
                    </Link>
                  )}
                />
              </CardTitle>
              <CardDescription>
                Start with a clear navigation structure, then add the tools your
                team needs.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Text size="sm" tone="muted">
                Workspace collection
              </Text>
              <ArrowUpRight size={16} aria-hidden="true" />
            </CardFooter>
          </Card>
          <Card aria-labelledby="media-free-title">
            <CardHeader>
              <Text as="span" size="sm" tone="muted">
                Guide · 3 minute read
              </Text>
              <CardTitle id="media-free-title" level={3}>
                Content can stand on its own
              </CardTitle>
              <CardDescription>
                The same structure works when there is no image.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <Text size="sm">
                Keep the content readable and reserve space for the actions that
                help someone continue. This card uses a regular footer link so
                its text can be selected.
              </Text>
            </CardBody>
            <CardFooter>
              <Link class={s.textLink} href="/kitchen-sink/layout">
                Explore layout primitives{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </Case>
      <Case
        title="Loading, empty, and failure"
        note="regional states with a working retry"
      >
        <CardStatesDemo />
      </Case>
      <Case
        title="Long content"
        note="wrapping, variable height, and optional sections"
      >
        <div class={s.grid}>
          <Card aria-labelledby="long-card-title">
            <CardHeader
              actions={
                <Badge glyph="●" tone="info">
                  In review
                </Badge>
              }
            >
              <CardTitle id="long-card-title" level={3}>
                A shared workspace for research, infrastructure, and the next
                release
              </CardTitle>
              <CardDescription>
                A longer title should stay readable when the card sits in a
                narrow column.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <Text size="sm">
                workspace-with-a-deliberately-unbroken-identifier-that-still-needs-to-fit-its-container
              </Text>
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                Owned by the platform team
              </Text>
              <Button
                asChild={(forwarded) => (
                  <Link {...forwarded()} href="/kitchen-sink/tables">
                    Browse workspace records
                  </Link>
                )}
                size="sm"
              />
            </CardFooter>
          </Card>
          <Card aria-labelledby="short-card-title">
            <CardHeader>
              <CardTitle id="short-card-title" level={3}>
                Short and complete
              </CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Cards in a grid can have different amounts of content.
              </CardDescription>
            </CardBody>
            <CardFooter>
              <Text size="sm" tone="muted">
                Footers align within their row.
              </Text>
            </CardFooter>
          </Card>
        </div>
      </Case>
    </Section>
  );
}
function WeeklyTrend() {
  const values = [9200, 10400, 9800, 11100, 10900, 12100, 12840];
  const points = values
    .map((value, index) => `${4 + index * 32},${44 - (value - 9000) / 100}`)
    .join(" ");
  return (
    <svg
      class={s.trend}
      viewBox="0 0 200 48"
      role="img"
      aria-label={`Daily active users, oldest to newest: ${values.join(", ")}.`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  );
}
function WorkspaceCover() {
  return (
    <svg
      class={s.cover}
      viewBox="0 0 480 270"
      role="img"
      aria-label="Illustration of three connected workspace modules"
    >
      <path
        class={s.coverGrid}
        d="M0 54H480M0 108H480M0 162H480M0 216H480M80 0V270M160 0V270M240 0V270M320 0V270M400 0V270"
      />
      <path class={s.coverLine} d="M160 135H320M240 85V190" />
      <rect class={s.coverTile} x="90" y="95" width="100" height="80" rx="8" />
      <rect class={s.coverTile} x="290" y="95" width="100" height="80" rx="8" />
      <rect
        class={s.coverCenter}
        x="190"
        y="55"
        width="100"
        height="80"
        rx="8"
      />
      <path
        class={s.coverDetail}
        d="M112 121H157M112 134H145M312 121H357M312 134H345"
      />
      <path
        class={s.coverGlyph}
        d="M219 80H235V96H219ZM245 80H261V96H245ZM219 106H235M245 106H261"
      />
      <circle class={s.coverDot} cx="240" cy="190" r="6" />
    </svg>
  );
}
