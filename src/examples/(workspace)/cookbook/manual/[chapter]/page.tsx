import { A as Link } from "@solidjs/router";
import { createMemo, For } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/disclosure";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { Heading, Text } from "~/components/typography";
import { ChapterNavigation } from "../_components/chapter-navigation";
import { ManualBlock } from "../_components/manual-block";
import { chapters, manualHref } from "../_lib/chapters";
import s from "../manual.module.css";
export default function Page(props: { chapter: (typeof chapters)[number] }) {
  const index = createMemo(() => chapters.indexOf(props.chapter)),
    previous = createMemo(() => chapters[index() - 1]),
    next = createMemo(() => chapters[index() + 1]);
  return (
    <Container width="page">
      <div class={s.reader}>
        <aside class={s.sidebar}>
          <div class={s.desktopChapters}>
            <ChapterNavigation current={props.chapter.slug} />
          </div>
          <div class={s.mobileChapters}>
            <Accordion type="single" collapsible>
              <AccordionItem value="chapters">
                <AccordionTrigger>
                  Chapters · {index() + 1} of {chapters.length}
                </AccordionTrigger>
                <AccordionContent>
                  <ChapterNavigation current={props.chapter.slug} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>
        <article class={s.article}>
          <div class={s.chapterHeader}>
            <Text size="sm" tone="muted">
              CHAPTER {String(index() + 1).padStart(2, "0")} /{" "}
              {String(chapters.length).padStart(2, "0")}
            </Text>
            <PageHeader
              title={props.chapter.title}
              description={props.chapter.description}
            />
          </div>
          <nav aria-label="On this page" class={s.contents}>
            <Text size="sm" weight="medium">
              On this page
            </Text>
            <ul>
              <For each={props.chapter.sections}>
                {(section) => (
                  <li>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                )}
              </For>
            </ul>
          </nav>
          <For each={props.chapter.sections}>
            {(section) => (
              <section
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                class={s.section}
              >
                <Heading level={2} size="md" id={`${section.id}-title`}>
                  {section.title}
                </Heading>
                {
                  <For each={section.blocks}>
                    {(block) => <ManualBlock block={block} />}
                  </For>
                }
              </section>
            )}
          </For>
          <nav aria-label="Continue reading" class={s.continue}>
            <Flex wrap gap={4}>
              <Button
                asChild={(forwarded) => (
                  <Link
                    {...forwarded()}
                    href={(() => {
                      const _previousSnapshot = previous();
                      return _previousSnapshot
                        ? manualHref(_previousSnapshot.slug)
                        : "/cookbook/manual";
                    })()}
                  >
                    {(() => {
                      const _previousSnapshot2 = previous();
                      return _previousSnapshot2
                        ? `Previous: ${_previousSnapshot2.title}`
                        : "Back to overview";
                    })()}
                  </Link>
                )}
              />
              {next() ? (
                <Button
                  intent="primary"
                  asChild={(forwarded) => (
                    <Link {...forwarded()} href={manualHref(next().slug)}>
                      Next: {next().title}
                    </Link>
                  )}
                />
              ) : (
                <Button
                  intent="primary"
                  asChild={(forwarded) => (
                    <Link {...forwarded()} href="/cookbook">
                      Explore the cookbook
                    </Link>
                  )}
                />
              )}
            </Flex>
          </nav>
        </article>
      </div>
    </Container>
  );
}
