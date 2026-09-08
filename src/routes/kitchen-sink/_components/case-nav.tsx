import { For, createSignal, onCleanup, onMount } from "solid-js";
import { cn } from "~/lib/kernel";
import s from "./sink.module.css";

/* The rail. Derived from the rendered page, not declared beside it.
 *
 * The top nav gets that property from the registry it composes; a second
 * hand-kept list of every case would have exactly the drift the registry
 * exists to avoid. So this reads `[data-section]` and `[data-case]` out of the
 * DOM — a case cannot exist and be unreachable, and one that is deleted leaves
 * no link behind.
 *
 * THE KEY GUARD IS LOAD-BEARING, and it was left out of the first version.
 * `rebuild` writes a signal, writing the signal re-renders these links, that
 * mutates the DOM, and the MutationObserver watching the DOM calls `rebuild`.
 * The loop never settles — the page never reaches network idle, and it
 * presents as a page that "does not finish loading" rather than as a nav bug.
 *
 * So the observer fires freely and the SIGNAL is only written when the set of
 * anchors actually changed, compared as a flat string. The build this is
 * ported from reached the same place from the other direction: its
 * `getSnapshot` had to return a stable string because a fresh array is a new
 * identity every call. Different framework, same guard, same reason.
 *
 * No default export. */

type Entry = { section: string; sectionId: string; cases: { id: string; title: string }[] };

function scan(): Entry[] {
  return [...document.querySelectorAll<HTMLElement>("[data-section]")].map((section) => ({
    section: section.dataset.section ?? "",
    sectionId: section.id,
    cases: [...section.querySelectorAll<HTMLElement>("[data-case]")].map((c) => ({
      id: c.id,
      title: c.dataset.case ?? "",
    })),
  }));
}

export function CaseNav() {
  const [entries, setEntries] = createSignal<Entry[]>([]);
  const [active, setActive] = createSignal<string | null>(null);

  onMount(() => {
    let io: IntersectionObserver | undefined;
    let key = "";

    const rebuild = () => {
      const next = [...document.querySelectorAll("[data-section], [data-case]")]
        .map((e) => e.id)
        .join(",");
      if (next === key) return;
      key = next;

      setEntries(scan());
      io?.disconnect();
      const targets = document.querySelectorAll<HTMLElement>("[data-case]");
      if (!targets.length) return;
      /* rootMargin pins the band near the top, so the active entry is what you
         are reading rather than whatever happens to be centred. */
      io = new IntersectionObserver(
        (records) => {
          const seen = records.find((r) => r.isIntersecting);
          if (seen) setActive(seen.target.id);
        },
        { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
      );
      for (const t of targets) io.observe(t);
    };

    rebuild();
    const mo = new MutationObserver(rebuild);
    mo.observe(document.body, { childList: true, subtree: true });
    onCleanup(() => {
      mo.disconnect();
      io?.disconnect();
    });
  });

  return (
    <nav class={s.caseNav} aria-label="Components on this page">
      <For each={entries()}>
        {(entry) => (
          <div class={s.caseGroup}>
            <a href={`#${entry.sectionId}`} class={s.caseSection}>{entry.section}</a>
            <For each={entry.cases}>
              {(c) => (
                <a
                  href={`#${c.id}`}
                  class={cn(s.caseLink, active() === c.id && s.caseLinkActive)}
                  /* Absent, not "false" — some screen readers announce
                     aria-current="false" as though it said something. */
                  aria-current={active() === c.id ? "true" : undefined}
                >
                  {c.title}
                </a>
              )}
            </For>
          </div>
        )}
      </For>
    </nav>
  );
}
