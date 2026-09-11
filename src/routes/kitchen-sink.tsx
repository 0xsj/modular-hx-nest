import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import type { JSX } from "solid-js";
import { DensityToggle, Mark, ThemeToggle } from "~/components/chrome";
import { CaseNav } from "~/examples/(dev)/kitchen-sink/_components/case-nav";
import { CatalogNav } from "~/examples/(dev)/kitchen-sink/_components/catalog-nav";
import s from "~/examples/(dev)/kitchen-sink/_components/sink.module.css";
import { QueryProvider } from "~/lib/query";
export default function KitchenSink(props: { children: JSX.Element }) {
  return (
    <QueryProvider>
      <Title>Kitchen sink · flover-solid</Title>
      <div class={s.shell}>
        <a href="#gallery-main" class={s.skipLink}>
          Skip to examples
        </a>
        <header class={s.header}>
          <div class={s.headerInner}>
            <A href="/kitchen-sink" aria-label="Flover kitchen sink">
              <Mark />
            </A>
            <span class={s.headerLabel}>Component catalog</span>
            <div class={s.controls}>
              <A href="/cookbook">Cookbook</A>
              <ThemeToggle />
              <DensityToggle />
            </div>
          </div>
        </header>
        <div class={s.body}>
          <CatalogNav />
          <main
            id="gallery-main"
            tabindex={-1}
            class={s.main}
            data-gallery-content
          >
            <div class={s.sections}>{props.children}</div>
          </main>
          <aside class={s.contentsRail}>
            <CaseNav />
          </aside>
        </div>
      </div>
    </QueryProvider>
  );
}
