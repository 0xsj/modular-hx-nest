import { Breadcrumb, NavLink, Tab, TabList, TabPanel, Tabs } from "~/components/navigation";
import { Stat } from "~/components/display";
import { Flex } from "~/components/layout";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import breadcrumbSrc from "~/components/navigation/breadcrumb/breadcrumb.tsx?raw";
import navLinkSrc from "~/components/navigation/nav-link/nav-link.tsx?raw";
import tabsSrc from "~/components/navigation/tabs/tabs.tsx?raw";

const src = {
  navLink: [source("navigation/nav-link/nav-link.tsx", navLinkSrc)],
  tabs: [source("navigation/tabs/tabs.tsx", tabsSrc)],
  breadcrumb: [source("navigation/breadcrumb/breadcrumb.tsx", breadcrumbSrc)],
} satisfies Record<string, readonly Source[]>;

export function NavigationSection() {
  return (
    <Section
      id="navigation"
      title="Navigation"
      blurb="Moving between places, and saying which place you are in. Each of these has a keyboard or announcement contract that is easy to omit and invisible once omitted — and the group's sharpest rule is that two of them must never be used for the other's job."
    >
      <Case title="NavLink" note="section vs current page" sources={src.navLink}>
        <Row label="live">
          {/* Real links against the real router — this page IS /kitchen-sink,
              so the middle one is genuinely current. */}
          <Flex gap={1}>
            {/* `end`, or a root link is prefix-active on every route. */}
            <NavLink href="/" end>Home</NavLink>
            <NavLink href="/kitchen-sink">Kitchen sink</NavLink>
            <NavLink href="/nowhere">Elsewhere</NavLink>
          </Flex>
        </Row>

        <p class={s.caseNote}>
          Two different questions, and a nav that answers only one is wrong in a way nobody
          reports. On <code>/sites/eu-west</code>, the <code>/sites</code> item should stay{" "}
          <strong>lit</strong> — you are inside it — and must <strong>not</strong> claim to be
          the current page, because it is not. Announcing "Sites, current page" sends somebody
          looking for a page they are not on.
        </p>
        <p class={s.caseNote}>
          The router already draws that line: <code>activeClass</code> is a{" "}
          <strong>prefix</strong> match, <code>aria-current="page"</code> is{" "}
          <strong>exact</strong>, always. So this component sets no{" "}
          <code>aria-current</code> of its own — the naive version, comparing href to pathname
          and writing the attribute, collapses the two questions into whichever one it
          implemented.
        </p>
        <p class={s.caseNote}>
          The stylesheet selects <code>[aria-current="page"]</code> rather than a class set
          from the same condition. A class and an attribute can drift; the day they do, the
          screen shows one page as current while a reader is told about another.
        </p>
        <p class={s.caseNote}>
          The Home link passes <code>end</code>. Without it a root link is active{" "}
          <em>everywhere</em>: the router normalises <code>"/"</code> to the empty string, so
          the prefix test becomes <code>location.startsWith("/")</code>, which is true on every
          route. <code>aria-current</code> is unaffected — it was already exact.
        </p>
        <p class={s.caseNote}>
          <code>activeClass</code> is passed explicitly because the router's defaults are the{" "}
          <strong>global</strong> names <code>"active"</code> and <code>"inactive"</code> — two
          unscoped classes in a codebase that otherwise has none. Both props are removed from
          the public type so a caller cannot reintroduce them.
        </p>
      </Case>

      <Case title="Breadcrumb" note="the last step is not a link" sources={src.breadcrumb}>
        <Row label="trail">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Sites", href: "/sites" },
              { label: "EU-West" },
            ]}
          />
        </Row>
        <Row label="gap in the middle">
          <Breadcrumb
            items={[
              { label: "Settings", href: "/settings" },
              { label: "Billing" },
              { label: "Invoice 2026-04" },
            ]}
          />
        </Row>

        <p class={s.caseNote}>
          It takes <strong>data, not children</strong>, and that is the whole design. Every
          rule a breadcrumb has is about the last item — it is the current page, it carries{" "}
          <code>aria-current="page"</code>, and it is <strong>not a link</strong>. A composed
          API leaves all three to every call site, and the failure is silent: a trail whose
          last step links to the page you are on looks completely normal.
        </p>
        <p class={s.caseNote}>
          A link to where you already are is an affordance that does nothing — announced as a
          link, tabbed to, and pressing it reloads. Rendering it as a <code>span</code> means
          the trail has as many tab stops as it has places you can actually go. "Billing" above
          has no page of its own and is text for the same reason.
        </p>
        <p class={s.caseNote}>
          The separators are elements hidden from the tree, not CSS <code>::before</code>{" "}
          content — generated content <em>is</em> announced by some readers, so putting the
          slash in the stylesheet moves it out of sight and leaves it in earshot. The{" "}
          <code>nav</code> is named because a page has several, and a landmark list reading
          "navigation, navigation, navigation" identifies none of them.
        </p>
      </Case>

      <Case title="Tabs" note="panels, never routes" sources={src.tabs}>
        <Row label="tabs">
          <Tabs defaultValue="overview" style={{ "inline-size": "100%" }}>
            <TabList>
              <Tab value="overview">Overview</Tab>
              <Tab value="streams">Streams</Tab>
              <Tab value="retention">Retention</Tab>
              <Tab value="archived" disabled>Archived</Tab>
            </TabList>
            <TabPanel value="overview">
              <Flex gap={6}>
                <Stat label="Cameras" value={148} />
                <Stat label="Offline" value={3} />
                <Stat label="Throughput" />
              </Flex>
            </TabPanel>
            <TabPanel value="streams"><p class={s.caseNote}>One panel at a time, and the panel is part of this page.</p></TabPanel>
            <TabPanel value="retention"><p class={s.caseNote}>The URL did not change, which is the whole test.</p></TabPanel>
            <TabPanel value="archived"><p class={s.caseNote}>Unreachable.</p></TabPanel>
          </Tabs>
        </Row>

        <p class={s.caseNote}>
          <strong>Does pressing it change the URL?</strong> If yes they are links — use{" "}
          <code>NavLink</code> in a <code>nav</code>. If no, they are tabs. The two are
          indistinguishable on screen and completely different underneath: route navigation
          built from tabs gives a page where the back button does nothing and middle-click does
          nothing, behaviours users do not report as bugs — they just stop using them.
        </p>
        <p class={s.caseNote}>
          The tab strip is <strong>one tab stop</strong>, with the arrow keys moving inside it
          and Home/End jumping to the ends. Doing that by hand means managing{" "}
          <code>tabindex</code> on every trigger as the selection moves, and the failure mode
          is a keyboard trap — which is exactly the long tail the headless library is for.
        </p>
        <p class={s.caseNote}>
          <code>activationMode</code> is a real choice, not taste. Automatic (focus selects) is
          right when the panels are already rendered. Manual is right when selecting is
          expensive, because automatic fires a request per arrow key on the way to the tab
          somebody actually wanted.
        </p>
      </Case>
    </Section>
  );
}
