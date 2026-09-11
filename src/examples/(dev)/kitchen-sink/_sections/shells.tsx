import { A as Link } from "@solidjs/router";
import type { NavGroup } from "~/components/shells";
import { SidebarNav } from "~/components/shells";
import { LayoutGrid, Settings, Sparkles } from "~/components/utility";
import { Case, Row, Section } from "../_components/section";
import { ShellExample } from "../_components/shell-preview";
import s from "../_components/sink.module.css";
const groups: NavGroup[] = [
  {
    items: [
      {
        href: "/app",
        label: "Overview",
        icon: LayoutGrid,
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        href: "/kitchen-sink",
        label: "Kitchen sink",
        icon: Sparkles,
      },
      {
        href: "/probe",
        label: "Transport probe",
        icon: Settings,
      },
    ],
  },
];
export function ShellsSection() {
  return (
    <Section
      id="shells"
      title="Shells"
      blurb="The first group that frames a whole page rather than answering what a control is — which means a shell that gets something wrong is wrong on every screen at once. The two application layouts and the authentication frame are shown in isolated previews, each with its own document and main landmark."
    >
      <Case
        title="AppShell"
        note="header, rail, main — and no opinion about what goes in them"
      >
        <ShellExample
          variant="standard"
          title="Standard application shell preview"
        />

        <p class={s.limits}>
          <code>nav</code>, <code>actions</code> and <code>brand</code> are{" "}
          <strong>slots</strong>. A shell taking <code>navItems</code>,{" "}
          <code>userName</code> and <code>showSearch</code> is a bet that those
          are the only things that vary, and the bet is lost the first time one
          item needs a badge — at which point the props grow rather than the
          composition.
        </p>
        <p class={s.limits}>
          It owns the page&rsquo;s one <code>&lt;main&gt;</code>. A screen that
          renders its own inside this one gives the document two, and the jump a
          reader makes to reach content stops meaning anything — asserted,
          because nothing about it is visible.
        </p>
        <p class={s.limits}>
          The header&rsquo;s height is <strong>derived</strong> from the control
          size and padding it actually uses, so it follows the density override.
          Switch density in this page&rsquo;s own header and the stage above
          follows. A typed-in height would be the exact defect that toggle
          exists to expose, shipped in the component that frames every page.
        </p>
      </Case>

      <Case
        title="RailShell"
        note="section rail, contextual sidebar, header, and independently scrolling content"
      >
        <ShellExample variant="rail" title="Rail application shell preview" />
        <p class={s.limits}>
          The icon rail stays available when the contextual sidebar is
          collapsed. At narrow widths, the sidebar opens below the header.
          NavigationRail, RailLink, and ContextSidebar can also be composed
          independently.
        </p>
      </Case>

      <Case
        title="AuthShell"
        note="one column, one card, and a required heading"
      >
        <ShellExample variant="auth" title="Authentication shell preview" />
        <p class={s.limits}>
          <code>title</code> is required and is rendered as the page&rsquo;s{" "}
          <code>h1</code>. A sign-in page whose only heading is a wordmark gives
          a reader arriving by keyboard nothing to orient on, and it is the
          commonest defect in this screen because it looks completely fine.
        </p>
        <p class={s.limits}>
          It owns the arrangement and nothing else — no form, no fields, no
          submit. Those differ per screen, and putting them here is how a shell
          acquires a <code>mode</code> prop and then four of them. Live at{" "}
          <Link href="/sign-in">/sign-in</Link> and{" "}
          <Link href="/sign-up">/sign-up</Link>.
        </p>
      </Case>

      <Case
        title="SidebarNav"
        note="the one group that takes data instead of slots"
      >
        <Row label="on /app">
          <div class={s.navWidth}>
            <SidebarNav groups={groups} current="/app" />
          </div>
        </Row>
        <Row label="on a nested route">
          <div class={s.navWidth}>
            <SidebarNav groups={groups} current="/kitchen-sink/tokens" />
          </div>
        </Row>
        <Row label="nowhere in particular">
          <div class={s.navWidth}>
            <SidebarNav groups={groups} />
          </div>
        </Row>
        <Row label="exact landing page and router links">
          <div class={s.navWidth}>
            <SidebarNav
              groups={[
                {
                  items: [
                    {
                      href: "/cookbook",
                      label: "Start here",
                      exact: true,
                    },
                    {
                      href: "/cookbook/dashboard",
                      label: "Dashboard",
                    },
                  ],
                },
              ]}
              current="/cookbook/dashboard"
              label="Cookbook example"
              renderLink={(item, content, forwarded) => (
                <Link {...forwarded} href={item.href}>
                  {content}
                </Link>
              )}
            />
          </div>
        </Row>

        <p class={s.limits}>
          A navigation genuinely is a list of links, so this one takes items as
          data — a product edits one file rather than hunting links through
          markup. Everything else in this group takes slots.
        </p>
        <p class={s.limits}>
          The current item carries <code>aria-current=&quot;page&quot;</code>,
          not just a different colour. Matching is by <strong>segment</strong>:
          a nested route marks the section it belongs to, <code>/app</code> does
          not light up for <code>/apples</code>, and <code>/</code> is exempt or
          it would be current everywhere. An <code>exact</code> landing item
          stays inactive on a child page. The <code>renderLink</code> slot lets
          a framework binding supply its own navigation link while retaining
          these semantics.
        </p>
        <p class={s.limits}>
          <code>current</code> is a <strong>prop</strong>. Reading the route
          needs a router, and the router is the one thing that cannot be shared
          with the Solid and Svelte siblings — so the six-line client component
          that reads the pathname lives in the route, which is
          framework-specific anyway.
        </p>
      </Case>
    </Section>
  );
}
