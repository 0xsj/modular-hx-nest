import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import { Heading, SectionLabel, Text } from "~/components/typography";
import { ArrowUpRight } from "~/components/utility";
import s from "./_components/sink.module.css";
import { CATALOG, CATALOG_GROUPS } from "./_lib/catalog";
export default function KitchenSinkPage() {
  return (
    <>
      <div class={s.intro}>
        <SectionLabel>Flover / design system</SectionLabel>
        <Heading level={1} size="xl">
          A place for every piece.
        </Heading>
        <Text size="lg" tone="muted" measure>
          Explore the foundations, try the controls, and compose the patterns.
          Each category has its own examples, states, and source.
        </Text>
        <Text size="sm" tone="quiet">
          {CATALOG.length} categories · light & dark · comfortable & compact
        </Text>
      </div>
      <For each={CATALOG_GROUPS}>
        {(group) => (
          <section class={s.catalogOverviewGroup} aria-label={group}>
            <Heading level={2} size="md">
              {group}
            </Heading>
            <div class={s.catalogCards}>
              <For each={CATALOG.filter((entry) => entry.group === group)}>
                {(entry) => (
                  <Link
                    href={`/kitchen-sink/${entry.id}`}
                    class={s.catalogCard}
                  >
                    <div class={s.catalogCardTitle}>
                      {entry.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </div>
                    <Text tone="muted" size="sm">
                      {entry.description}
                    </Text>
                  </Link>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
    </>
  );
}
