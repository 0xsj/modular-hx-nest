import { Title } from "@solidjs/meta";
import { For, createSignal, onMount } from "solid-js";
import { CaseNav } from "./_components/case-nav";
import { SECTIONS } from "./_sections/registry";
import s from "./_components/sink.module.css";

type Choice = "system" | "light" | "dark";

/* The shell and the page in one file. The build this is ported from splits
 * them into `layout.tsx` and `page.tsx` because a Next route group needs a
 * layout to hold the chrome; there is one page here and nothing to share it
 * with, so the split would be a file with one caller.
 *
 * This is the only file in the directory with a default export, and that is
 * the mechanism rather than a convention: SolidStart's router makes a route
 * out of a file under `src/routes` if and only if it has one. Give
 * `_sections/tokens.tsx` a default export and `/kitchen-sink/_sections/tokens`
 * quietly becomes a page. */
export default function KitchenSink() {
  const [choice, setChoice] = createSignal<Choice>("system");
  /* Bumped on every deliberate theme change. Sections read resolved token
     values, which are theme dependent, so they need a signal to re-read from —
     the attribute on <html> is not something Solid tracks. */
  const [revision, setRevision] = createSignal(0);

  onMount(() => {
    /* ADOPT the document's theme; do not assert over it. A mount effect that
       writes its own default erases whatever was already on the element, and
       does it after first paint, so the page visibly flips. The write belongs
       in the click handler — the one place a change is intended. */
    const stamped = document.documentElement.getAttribute("data-theme");
    setChoice(stamped === "light" || stamped === "dark" ? stamped : "system");
  });

  const pick = (next: Choice) => {
    setChoice(next);
    /* `system` REMOVES the attribute rather than writing "system". The third
       state is the ABSENCE of the attribute — the semantic layer's guard is
       `:root:not([data-theme="dark"])`, which a third value would satisfy by
       accident and then break the day somebody writes a `[data-theme]` rule
       assuming the attribute names a real palette. */
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    setRevision((n) => n + 1);
  };

  return (
    <div class={s.shell}>
      <Title>Kitchen sink</Title>

      <header class={s.header}>
        <div class={s.headerInner}>
          <span class={s.wordmark}>flover</span>
          <nav aria-label="Sections on this page" class={s.nav}>
            <For each={SECTIONS}>
              {(entry) => <a href={`#${entry.id}`} class={s.navLink}>{entry.label}</a>}
            </For>
          </nav>
          <div class={s.controls}>
            {/* Three buttons, because the theme has three states and not two.
                Not a ThemeToggle component — `components/chrome` is empty, and
                a primitive built to serve this page would be a primitive
                designed by its first caller. */}
            <div class={s.themeGroup} role="group" aria-label="Theme">
              <For each={["system", "light", "dark"] as const}>
                {(c) => (
                  <button
                    type="button"
                    class={s.themeBtn}
                    aria-pressed={choice() === c}
                    onClick={() => pick(c)}
                  >
                    {c}
                  </button>
                )}
              </For>
            </div>
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
                <span aria-hidden="true">tokens only</span>
                <span class={s.srOnly}>
                  Tokens only. The design system has no components yet, so every section below is
                  the token layer rendered directly rather than a component reading it.
                </span>
              </span>
            </div>
            <p class={s.lede}>
              The design system, rendered, with nothing above it. Both navigations are derived from
              the page rather than declared beside it — the top from the same registry it composes,
              the rail from the cases actually on screen — so nothing here can exist and be
              unreachable. Every value is read out of the document the browser loaded, not out of
              the stylesheet on disk, so this page fails when the cascade fails and not only when
              the source is wrong.
            </p>
            <p class={s.lede}>
              <strong>Asserted, not measured.</strong> It proves the cascade resolved to the value
              a token names. It does not sample a rendered pixel, so it cannot see what
              antialiasing costs a 10px glyph — which reads worse than the token specifies. That
              is a different instrument and a different job.
            </p>
          </div>

          <div class={s.sections}>
            <For each={SECTIONS}>
              {(entry) => <entry.Section revision={revision()} />}
            </For>
          </div>
        </main>
      </div>
    </div>
  );
}
