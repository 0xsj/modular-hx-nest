import { A as Link } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { Button } from "~/components/forms";
import { Menu, X } from "~/components/utility";
import { cn } from "~/lib/kernel";
import { usePathname } from "~/lib/navigation";
import { CATALOG, CATALOG_GROUPS } from "../_lib/catalog";
import s from "./sink.module.css";
function Navigation(props: { pathname: string }) {
  const [open, setOpen] = createSignal(false);
  return (
    <aside
      class={s.rail}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open()) {
          setOpen(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>("button")
            ?.focus();
        }
      }}
    >
      <Button
        intent="secondary"
        class={s.mobileNavToggle}
        aria-expanded={open()}
        aria-controls="catalog-navigation"
        onClick={() => setOpen(!open())}
      >
        {open() ? (
          <X size={16} aria-hidden="true" />
        ) : (
          <Menu size={16} aria-hidden="true" />
        )}{" "}
        Browse components
      </Button>
      <nav
        id="catalog-navigation"
        aria-label="Component catalog"
        class={s.catalogNav}
        data-open={open() ? "" : undefined}
      >
        <Link
          class={cn(
            s.catalogLink,
            props.pathname === "/kitchen-sink" && s.catalogActive,
          )}
          href="/kitchen-sink"
          aria-current={props.pathname === "/kitchen-sink" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Overview
        </Link>
        <For each={CATALOG_GROUPS}>
          {(group) => (
            <div class={s.catalogGroup}>
              <p class={s.caseSection}>{group}</p>
              <For each={CATALOG.filter((entry) => entry.group === group)}>
                {(entry) => {
                  const href = `/kitchen-sink/${entry.id}`;
                  return (
                    <Link
                      href={href}
                      class={cn(
                        s.catalogLink,
                        props.pathname === href && s.catalogActive,
                      )}
                      aria-current={
                        props.pathname === href ? "page" : undefined
                      }
                      onClick={() => setOpen(false)}
                    >
                      {entry.label}
                    </Link>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </nav>
    </aside>
  );
}
export function CatalogNav() {
  const pathname = usePathname();
  return <Navigation pathname={pathname()} />;
}
