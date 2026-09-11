import { createMemo, For } from "solid-js";
import { cn } from "~/lib/kernel";
import { observeStore } from "~/lib/runtime/observe";
import s from "./sink.module.css";
type Entry = {
  id: string;
  title: string;
};
const serverSnapshot = () => "";
const cases = () => [
  ...document.querySelectorAll<HTMLElement>(
    "[data-gallery-content] [data-case]",
  ),
];
function subscribe(onChange: () => void) {
  const main = document.querySelector("[data-gallery-content]");
  const observer = new MutationObserver(onChange);
  if (main)
    observer.observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "data-case"],
    });
  return () => observer.disconnect();
}
function snapshot() {
  return JSON.stringify(
    cases().map((element) => ({
      id: element.id,
      title: element.dataset.case ?? "",
    })),
  );
}
function subscribeScroll(onChange: () => void) {
  const unsubscribe = subscribe(onChange);
  window.addEventListener("scroll", onChange, {
    passive: true,
  });
  window.addEventListener("resize", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    unsubscribe();
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}
function activeSnapshot() {
  const entries = cases();
  if (!entries.length) return "";
  if (
    window.scrollY > 0 &&
    window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
  )
    return entries.at(-1)!.id;
  return (
    entries
      .filter((element) => element.getBoundingClientRect().top <= 140)
      .at(-1)?.id ?? entries[0].id
  );
}
export function CaseNav() {
  const key = observeStore(subscribe, snapshot, serverSnapshot);
  const entries = createMemo<Entry[]>(() => {
    const _keySnapshot = key();
    return _keySnapshot ? JSON.parse(_keySnapshot) : [];
  });
  const active = observeStore(subscribeScroll, activeSnapshot, serverSnapshot);
  return (
    <>
      {(() => {
        const _entriesSnapshot = entries();
        return !!_entriesSnapshot.length ? (
          <nav class={s.caseNav} aria-label="On this page">
            <p class={s.caseSection}>On this page</p>
            <For each={_entriesSnapshot}>
              {(entry) => (
                <a
                  href={`#${entry.id}`}
                  class={cn(
                    s.caseLink,
                    active() === entry.id && s.caseLinkActive,
                  )}
                  aria-current={active() === entry.id ? "location" : undefined}
                >
                  {entry.title}
                </a>
              )}
            </For>
          </nav>
        ) : null;
      })()}
    </>
  );
}
