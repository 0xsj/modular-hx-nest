import { Title } from "@solidjs/meta";
import { For, type JSX } from "solid-js";
import { DensityToggle, Mark, ThemeToggle } from "~/components/chrome";
import { hydrateRuntime } from "~/lib/runtime";
import { QueryProvider } from "~/lib/query";
import { CaseNav } from "./kitchen-sink/_components/case-nav";
import { SECTIONS } from "./kitchen-sink/_sections/registry";
import s from "./kitchen-sink/_components/sink.module.css";

/* The shell. A layout earns its own file once the chrome and the content have
 * different reasons to change — the header nav is derived from the registry,
 * the rail from the DOM, and neither is any page's business.
 *
 * SolidStart nests a layout by NAME: this file sits beside the `kitchen-sink/`
 * directory and wraps every route inside it. */
export default function KitchenSinkLayout(props: { children?: JSX.Element }) {
  /* Read the stored preferences once, after mount. It used to live inside the
     route's own theme control; now that the control is a real component with
     no state of its own, the shell is the thing that owns hydrating them. */
  hydrateRuntime();

  return (
    <QueryProvider>
      <div class={s.shell}>
        <Title>Kitchen sink · flover</Title>

        <header class={s.header}>
          <div class={s.headerInner}>
            <Mark href="/" size="sm" />
            <nav aria-label="Sections on this page" class={s.nav}>
              <For each={SECTIONS}>
                {(entry) => <a href={`#${entry.id}`} class={s.navLink}>{entry.label}</a>}
              </For>
            </nav>
            <div class={s.controls}>
              <ThemeToggle labelHidden />
              <DensityToggle labelHidden />
            </div>
          </div>
        </header>

        <div class={s.body}>
          <aside class={s.rail}>
            <CaseNav />
          </aside>

          <main class={s.main}>
            <div class={s.intro}>
              <div class={s.titleRow}>
                <h1 class={s.h1}>Kitchen sink</h1>
                <span class={s.mockBadge}>
                  <span aria-hidden="true">dev only</span>
                  <span class={s.srOnly}>
                    A development surface. Everything here is a specimen or a harness, not a
                    record.
                  </span>
                </span>
              </div>
              <p class={s.lede}>
                The design system, rendered, with nothing above it. Both navigations are
                derived from the page rather than declared beside it — the top from the same
                registry it composes, the rail from the cases actually on screen — so nothing
                here can exist and be unreachable.
              </p>
              <p class={s.lede}>
                <strong>Asserted, not measured.</strong> Values are read out of the document
                the browser loaded, which proves the cascade resolved. It does not sample a
                rendered pixel, so it cannot see what antialiasing costs a 10px glyph.
              </p>
            </div>
            <div class={s.sections}>{props.children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
