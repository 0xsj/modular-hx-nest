import { A as Link } from "@solidjs/router";
import { createMemo, For } from "solid-js";
import { ThemeToggle } from "~/components/chrome";
import {
  Avatar,
  Badge,
  DescriptionItem,
  DescriptionList,
  Panel,
  Stat,
} from "~/components/display";
import { Button, Field, Input } from "~/components/forms";
import { PageHeader } from "~/components/patterns";
import {
  AppShell,
  AuthShell,
  ContextSidebar,
  NavigationRail,
  RailLink,
  RailShell,
  SidebarNav,
} from "~/components/shells";
import { Text } from "~/components/typography";
import { LayoutGrid, Network, Settings, Sparkles } from "~/components/utility";
import s from "./shell-preview.module.css";
import { usePreviewPreferences } from "./use-preview-preferences";
const SECTIONS = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Projects, people, and recent work",
    Icon: LayoutGrid,
    pages: ["Overview", "Projects", "Activity"],
  },
  {
    id: "reports",
    label: "Reports",
    description: "Results, exports, and shared reports",
    Icon: Network,
    pages: ["Summary", "Exports"],
  },
  {
    id: "settings",
    label: "Settings",
    description: "Workspace preferences and membership",
    Icon: Settings,
    pages: ["General", "Members"],
  },
] as const;
export function ShellPreview(props: {
  variant: "standard" | "rail" | "auth";
  section?: string;
  page?: string;
}) {
  usePreviewPreferences();
  const current = createMemo(
    () => SECTIONS.find((item) => item.id === props.section) ?? SECTIONS[0],
  );
  const currentPage = createMemo(() => {
    const _currentSnapshot = current();
    return (
      _currentSnapshot.pages.find(
        (item) => item.toLowerCase() === props.page,
      ) ?? _currentSnapshot.pages[0]
    );
  });
  const href = (id: string, name: string) =>
    `/shell-preview/${props.variant}?section=${id}&page=${name.toLowerCase()}`;
  const groups = createMemo(() => [
    {
      items: current().pages.map((name) => ({
        label: name,
        href: href(current().id, name),
      })),
    },
  ]);
  const navigation = () => (
    <SidebarNav
      groups={groups()}
      current={href(current().id, currentPage())}
      label={`${current().label} pages`}
    />
  );
  const account = () => (
    <div class={s.account}>
      <Avatar name="Ada Lovelace" size="sm" />
      <div>
        <Text size="sm">Ada Lovelace</Text>
        <Text size="sm" tone="quiet">
          Sample workspace
        </Text>
      </div>
    </div>
  );
  const header = () => (
    <div class={s.header}>
      <Text size="sm" tone="muted">
        {current().label} / {currentPage()}
      </Text>
      <ThemeToggle />
    </div>
  );
  const content = () => (
    <div class={s.content}>
      <PageHeader
        title={currentPage()}
        description={`${current().description}. This preview uses illustrative data.`}
        actions={
          <Badge glyph="●" tone="accent">
            Ready
          </Badge>
        }
      />
      <div class={s.metrics}>
        <Stat label="Projects" value={12} />
        <Stat label="Members" value={8} />
        <Stat label="Open requests" value={0} />
      </div>
      <Panel title={`${currentPage()} details`}>
        <DescriptionList>
          <DescriptionItem term="Workspace">Northstar</DescriptionItem>
          <DescriptionItem term="Owner">Ada Lovelace</DescriptionItem>
          <DescriptionItem term="Navigation">
            {props.variant === "rail"
              ? "Icon rail → section pages → content"
              : "Header → sidebar → content"}
          </DescriptionItem>
        </DescriptionList>
      </Panel>
      <Text size="sm" tone="quiet">
        Use the navigation to move between preview pages. Resize the window to
        try the compact layout.
      </Text>
    </div>
  );
  return (
    <>
      {props.variant === "auth" ? (
        <AuthShell
          title="Sign in"
          description="An isolated shell preview."
          footer={
            <Link href="/kitchen-sink/shells" target="_top">
              Back to the catalog
            </Link>
          }
        >
          <div class={s.content}>
            <Field label="Email">
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  placeholder="you@example.com"
                />
              )}
            </Field>
            <Field label="Password">
              {(control) => <Input {...control} type="password" />}
            </Field>
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/sign-in" target="_top">
                  Open sign-in screen
                </Link>
              )}
              intent="primary"
            />
          </div>
        </AuthShell>
      ) : props.variant === "standard" ? (
        <AppShell
          nav={
            <ContextSidebar
              title="Northstar"
              description="Sample workspace"
              footer={account()}
            >
              <SidebarNav
                groups={SECTIONS.map((item) => ({
                  label: item.label,
                  items: item.pages.map((name) => ({
                    label: name,
                    href: href(item.id, name),
                  })),
                }))}
                current={href(current().id, currentPage())}
              />
            </ContextSidebar>
          }
          actions={<ThemeToggle />}
        >
          {content()}
        </AppShell>
      ) : (
        <RailShell
          header={header()}
          rail={
            <NavigationRail
              brand={
                <Link
                  href={href("workspace", "Overview")}
                  aria-label="Flover workspace"
                >
                  <Sparkles size={21} aria-hidden="true" />
                </Link>
              }
              footer={
                <RailLink
                  href="/kitchen-sink/shells"
                  target="_top"
                  label="Component catalog"
                  description="Return to the Flover shell examples"
                >
                  <Sparkles size={17} aria-hidden="true" />
                </RailLink>
              }
            >
              <For each={SECTIONS}>
                {(item) => (
                  <RailLink
                    asChild={(forwarded) => (
                      <Link
                        {...forwarded()}
                        href={href(item.id, item.pages[0])}
                      >
                        <item.Icon size={17} aria-hidden="true" />
                      </Link>
                    )}
                    label={item.label}
                    description={item.description}
                    active={current().id === item.id}
                  />
                )}
              </For>
            </NavigationRail>
          }
          sidebar={
            <ContextSidebar
              title={current().label}
              description={current().description}
              footer={account()}
            >
              {navigation()}
            </ContextSidebar>
          }
        >
          {content()}
        </RailShell>
      )}
    </>
  );
}
