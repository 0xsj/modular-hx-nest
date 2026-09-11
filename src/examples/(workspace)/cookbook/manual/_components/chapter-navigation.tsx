import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import { NavLink } from "~/components/navigation";
import { Text } from "~/components/typography";
import { chapters, manualHref } from "../_lib/chapters";
import s from "../manual.module.css";
export function ChapterNavigation(props: { current: string }) {
  return (
    <nav aria-label="Manual chapters" class={s.chapterNav}>
      <Text size="sm" tone="muted">
        USER MANUAL
      </Text>
      <NavLink
        asChild={(forwarded) => (
          <Link {...forwarded()} href="/cookbook/manual">
            Overview
          </Link>
        )}
      />
      <ol>
        {
          <For each={chapters}>
            {(chapter, index) => (
              <li>
                <NavLink
                  active={props.current === chapter.slug}
                  asChild={(forwarded) => (
                    <Link {...forwarded()} href={manualHref(chapter.slug)}>
                      <span class={s.chapterNumber} aria-hidden="true">
                        {String(index() + 1).padStart(2, "0")}
                      </span>
                      {chapter.title}
                    </Link>
                  )}
                />
              </li>
            )}
          </For>
        }
      </ol>
      <a
        href="/cookbook/manual/download"
        download="flover-manual.md"
        class={s.download}
      >
        Download Markdown
      </a>
    </nav>
  );
}
