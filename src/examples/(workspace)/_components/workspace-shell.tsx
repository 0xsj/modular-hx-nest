import { A as Link } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { DensityToggle, ThemeToggle } from "~/components/chrome";
import { Button } from "~/components/forms";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/overlays";
import {
  ContextSidebar,
  NavigationRail,
  RailLink,
  RailShell,
  SidebarNav,
} from "~/components/shells";
import { Text } from "~/components/typography";
import { BookOpen, LayoutGrid, Settings, Sparkles } from "~/components/utility";
import { authHref } from "~/lib/app/return-to";
import { usePathname } from "~/lib/navigation";
import { useHydrateRuntime } from "~/lib/runtime/hooks";
import { APP_NAV, COOKBOOK_NAV, workspaceArea } from "../_lib/navigation";
import s from "./workspace-shell.module.css";
export function WorkspaceShell(props: {
  children: JSX.Element;
  account?: JSX.Element;
}) {
  useHydrateRuntime();
  const pathname = usePathname();
  const area = createMemo(() => workspaceArea(pathname()));
  const title = createMemo(() => (area() === "app" ? "Your app" : "Cookbook"));
  const groups = createMemo(() => (area() === "app" ? APP_NAV : COOKBOOK_NAV));
  const page = createMemo(
    () =>
      groups()
        .flatMap((group) => group.items)
        .find(
          (item) =>
            item.href === pathname() ||
            (!item.exact && pathname().startsWith(`${item.href}/`)),
        )?.label,
  );
  return (
    <RailShell
      sidebarLabel={`${title()} navigation`}
      rail={
        <NavigationRail
          label="Flover areas"
          brand={
            <Link class={s.brand} href="/cookbook" aria-label="Flover home">
              <Sparkles size={20} aria-hidden="true" />
            </Link>
          }
        >
          <RailLink
            asChild={(forwarded) => (
              <Link {...forwarded()} href="/app">
                <LayoutGrid size={18} aria-hidden="true" />
              </Link>
            )}
            label="Your app"
            active={area() === "app"}
          />
          <RailLink
            asChild={(forwarded) => (
              <Link {...forwarded()} href="/cookbook">
                <BookOpen size={18} aria-hidden="true" />
              </Link>
            )}
            label="Cookbook"
            active={area() === "cookbook"}
          />
          <RailLink
            asChild={(forwarded) => (
              <Link {...forwarded()} href="/kitchen-sink">
                <Sparkles size={18} aria-hidden="true" />
              </Link>
            )}
            label="Components"
            description="Browse the component catalog"
          />
        </NavigationRail>
      }
      sidebar={
        <ContextSidebar
          title={title()}
          description={
            area() === "app"
              ? "Space for your next product."
              : "Working examples to build from."
          }
          footer={
            <Text size="sm" tone="muted">
              {area() === "app" ? "Flover workspace" : "Flover reference"}
            </Text>
          }
        >
          <SidebarNav
            groups={groups()}
            current={pathname()}
            label={`${title()} pages`}
            renderLink={(item, content, forwarded) => (
              <Link {...forwarded} href={item.href}>
                {content}
              </Link>
            )}
          />
        </ContextSidebar>
      }
      header={
        <div class={s.header}>
          <div class={s.location}>
            <Text size="sm" tone="muted">
              {title()}
            </Text>
            {(() => {
              const _pageSnapshot = page();
              return _pageSnapshot ? (
                <>
                  <span aria-hidden="true" class={s.separator}>
                    /
                  </span>
                  <Text size="sm">{_pageSnapshot}</Text>
                </>
              ) : null;
            })()}
          </div>
          <div class={s.actions}>
            <Popover>
              <PopoverTrigger
                asChild={(forwarded) => (
                  <Button
                    {...forwarded()}
                    intent="ghost"
                    size="icon"
                    aria-label="Appearance"
                  >
                    <Settings size={17} aria-hidden="true" />
                  </Button>
                )}
              />
              <PopoverContent
                align="end"
                aria-label="Appearance preferences"
                class={s.preferences}
              >
                <div>
                  <Text size="sm" tone="muted">
                    Theme
                  </Text>
                  <ThemeToggle />
                </div>
                <div>
                  <Text size="sm" tone="muted">
                    Density
                  </Text>
                  <DensityToggle />
                </div>
                <Text size="sm" tone="quiet">
                  Saved in this browser.
                </Text>
              </PopoverContent>
            </Popover>
            {props.account ?? (
              <Button
                asChild={(forwarded) => (
                  <Link
                    {...forwarded()}
                    href={authHref("/sign-in", pathname())}
                  >
                    Sign in
                  </Link>
                )}
                intent="secondary"
                size="sm"
              />
            )}
          </div>
        </div>
      }
    >
      {props.children}
    </RailShell>
  );
}
