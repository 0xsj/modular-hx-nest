import { Badge } from "~/components/display";
import { Box, Flex } from "~/components/layout";
import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
  NavLink,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
} from "~/components/navigation";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { PaginationCase } from "./additional-controls";
export function NavigationSection() {
  return (
    <Section
      id="navigation"
      title="Navigation"
      blurb="Moving between places, and saying which place you are in. Every one of these has a keyboard contract that is easy to omit and invisible once omitted — and all three style themselves from aria-current or a reported state, so nothing can look current without saying it is."
    >
      <Case
        title="NavLink"
        note="active is a prop; the component does not read the route"
      >
        <Box class={s.navWidth}>
          <Flex direction="column" gap={1}>
            <NavLink href="#navigation" active>
              Targets
            </NavLink>
            <NavLink href="#navigation">Findings</NavLink>
            <NavLink href="#navigation">Settings</NavLink>
          </Flex>
        </Box>
        <p class={s.limits}>
          <code>aria-current=&quot;page&quot;</code> is the whole value, and it
          is the thing that gets forgotten — a nav whose active item is only a
          different colour tells a reader nothing about where they are. The
          styling keys off that attribute, so a link cannot look current without
          saying it is.
        </p>
        <p class={s.limits}>
          Working out <em>which</em> link is active needs a router, and a router
          is the one thing that differs between this template and its two
          siblings. So <code>active</code> is a prop and the caller answers it —
          the same argument as the composition root: a tier that fetches its own
          context cannot leave the runtime it fetched it from.
        </p>
      </Case>

      <Case title="Breadcrumb" note="the last crumb is not a link">
        <Breadcrumb>
          <BreadcrumbLink href="#navigation">Home</BreadcrumbLink>
          <BreadcrumbLink href="#navigation">Targets</BreadcrumbLink>
          <BreadcrumbCurrent>api.example.com</BreadcrumbCurrent>
        </Breadcrumb>
        <p class={s.limits}>
          A link to the page you are already on is a control that does nothing:
          offered, focused, activated, and nothing happens. The current page is
          a span carrying <code>aria-current</code> — the meaning was never in
          the anchor. Separators are real elements with <code>aria-hidden</code>
          rather than generated content, which some readers announce and others
          do not.
        </p>
      </Case>

      <Case
        title="Tabs"
        note="automatic activation, until showing a panel costs something"
      >
        <Row label="automatic">
          <Box class={s.fullWidth}>
            <Tabs defaultValue="overview">
              <TabsList>
                <Tab value="overview">Overview</Tab>
                <Tab value="findings">
                  Findings <Badge tone="crit">3</Badge>
                </Tab>
                <Tab value="history">History</Tab>
                <Tab value="archived" disabled>
                  Archived
                </Tab>
              </TabsList>
              <TabPanel value="overview">
                Arrowing here showed this panel immediately.
              </TabPanel>
              <TabPanel value="findings">
                Three findings on this target.
              </TabPanel>
              <TabPanel value="history">
                Nothing has changed in ninety days.
              </TabPanel>
            </Tabs>
          </Box>
        </Row>

        <Row label="manual">
          <Box class={s.fullWidth}>
            <Tabs defaultValue="cheap" activationMode="manual">
              <TabsList>
                <Tab value="cheap">Cheap</Tab>
                <Tab value="costly">Costly</Tab>
                <Tab value="also">Also costly</Tab>
              </TabsList>
              <TabPanel value="cheap">
                Arrow to the next tab: focus moves, this panel stays.
              </TabPanel>
              <TabPanel value="costly">Committed with Enter.</TabPanel>
              <TabPanel value="also">Committed with Enter.</TabPanel>
            </Tabs>
          </Box>
        </Row>

        <p class={s.limits}>
          Automatic is the platform contract and what a keyboard user expects,
          so it is the default.{" "}
          <strong>Switch to manual when showing a panel is expensive</strong> —
          a fetch, a chart — because travelling past four tabs then costs one
          panel rather than four. Right default, wrong one for a dashboard.
        </p>
        <p class={s.limits}>
          Like a radio group, the strip is <strong>one tab stop</strong> with
          arrows inside it — the contract a hand-rolled tab strip almost always
          misses, and the reason a page with six tabs otherwise costs six tab
          presses to walk past.
        </p>
      </Case>
      <PaginationCase />
    </Section>
  );
}
