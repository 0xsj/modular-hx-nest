import { For, Show, createEffect, createSignal } from "solid-js";
import { Case, Chip, Row, Section } from "../_components/section";
import { auditThemes, collectTokens, type Audit, type Check, type Theme, type Token } from "../_lib/tokens";
import s from "../_components/sink.module.css";

const SURFACES = ["--surface-ground", "--surface-rail", "--surface-sunk", "--surface-panel", "--surface-panel-2", "--surface-raised"];
const STATUS = ["--accent", "--accent-dim", "--fill", "--warn", "--crit", "--info"];
const INK = ["--ink", "--ink-2", "--ink-3", "--ink-4"];

function AuditTable(props: { rows: Check[]; theme: Theme }) {
  const failed = () => props.rows.filter((r) => !r.pass).length;
  return (
    <div class={s.auditBlock}>
      <Row label={props.theme}>
        <Chip tone={failed() ? "crit" : "accent"} glyph={failed() ? "✕" : "✓"}>
          {failed() ? `${failed()} below threshold` : `${props.rows.length} pairs pass`}
        </Chip>
      </Row>
      <div class={s.scroller}>
        <table class={s.audit}>
          <thead>
            <tr>
              <th scope="col">Foreground</th>
              <th scope="col">On</th>
              <th scope="col" class={s.num}>Ratio</th>
              <th scope="col" class={s.num}>Needs</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.rows}>
              {(r) => (
                <tr>
                  <td class={s.mono}>{r.fg}</td>
                  <td class={s.mono}>{r.bg}</td>
                  <td class={`${s.mono} ${s.num} ${r.pass ? s.pass : s.fail}`}>{r.ratio.toFixed(2)}:1</td>
                  <td class={`${s.mono} ${s.num} ${s.pass}`}>{r.large ? "3.00" : "4.50"}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Swatches(props: { tokens: string[] }) {
  return (
    <div class={s.swatches}>
      <For each={props.tokens}>
        {(t) => (
          <div class={s.swatch}>
            <div class={s.swatchChip}>
              <div class={s.swatchFill} style={{ background: `var(${t})` }} />
            </div>
            <div class={s.swatchLabel}>{t}</div>
          </div>
        )}
      </For>
    </div>
  );
}

function TokenGrid(props: { tokens: Token[]; showPointer?: boolean }) {
  return (
    <div class={s.swatches}>
      <For each={props.tokens}>
        {(t) => (
          <div class={s.swatch}>
            <div class={s.swatchChip}>
              <div class={s.swatchFill} style={{ background: `var(${t.name})` }} />
            </div>
            <div class={s.swatchLabel}>{t.name}</div>
            <Show when={props.showPointer}>
              <div class={s.swatchPoints}>{t.authored}</div>
            </Show>
            <div class={s.swatchValue}>{t.resolved}</div>
          </div>
        )}
      </For>
    </div>
  );
}

export function TokensSection(props: { revision: number }) {
  const [tokens, setTokens] = createSignal<Token[]>([]);
  const [audit, setAudit] = createSignal<Audit>({ dark: [], light: [], skipped: 0 });

  const read = () => {
    setTokens(collectTokens());
    setAudit(auditThemes());
  };
  /* Reads on the client after render, and again whenever the theme changes.
     `revision` is a number the shell bumps on every deliberate change —
     the resolved column and the swatches are theme dependent, and a page
     showing one theme's values under another's stamp would be confidently
     wrong. `createEffect` does not run during SSR, which is what keeps
     `document` out of the server render. */
  createEffect(() => {
    props.revision;
    read();
  });

  const colours = (tier: "palette" | "semantic") =>
    tokens().filter((t) => t.kind === "color" && t.tier === tier);
  const scales = () => tokens().filter((t) => t.kind === "scale");

  return (
    <Section
      id="tokens"
      title="Tokens"
      blurb="Every value a component may read. The audit below is computed from the cascade the browser actually resolved — this page fails visibly when a token stops clearing its contrast threshold, which is the failure that survived two visual reviews before anybody computed it."
    >
      <Case title="Contrast audit" note="every ink on every ground, both themes, computed from the live cascade">
        <p class={s.caseNote}>
          The full cross product rather than a list of the pairs the design promises. A
          hand-written list is the stated limit of a contrast audit — a pair used on a real
          screen and absent from the list is unaudited, and nothing detects that. The cost is
          that this includes pairs no screen will ever use, so a failing row is a prompt to
          check rather than proof of a defect. Translucent tokens are skipped, because scoring
          one needs a decision about what sits behind it: <strong>{audit().skipped} skipped</strong>.
        </p>
        <Show when={audit().dark.length} fallback={<p class={s.unread}>not read yet — this runs on the client</p>}>
          <AuditTable rows={audit().dark} theme="dark" />
          <AuditTable rows={audit().light} theme="light" />
        </Show>
      </Case>

      <Case title="Ink" note="monotonic in prominence in both themes">
        <For each={INK}>
          {(t) => (
            <Row label={t}>
              <span style={{ color: `var(${t})` }}>
                The eye confirms a label exists and moves on. Contrast is a ratio, and the eye has no scale for it.
              </span>
            </Row>
          )}
        </For>
      </Case>

      <Case title="Surfaces">
        <Swatches tokens={SURFACES} />
      </Case>

      <Case title="Accent and status" note="the accent is also the healthy state, so nothing is hue alone">
        <Swatches tokens={STATUS} />
        <Row label="never hue alone">
          <Chip tone="accent" glyph="●">ok</Chip>
          <Chip tone="warn" glyph="▲">warning</Chip>
          <Chip tone="crit" glyph="✕">critical</Chip>
          <Chip tone="info" glyph="›">note</Chip>
          <Chip>neutral</Chip>
        </Row>
        <p class={s.caseNote}>
          Green says clickable and green says healthy. So every state above carries a glyph and
          a word as well as a hue — the chips stay distinguishable in greyscale, which is the
          only thing keeping a status legible when the accent and the success colour are the
          same family.
        </p>
      </Case>

      <Case title="Palette" note="tier one — raw values, no meaning">
        <p class={s.caseNote}>
          A component may never name one of these. A component that reaches into the palette has
          pinned a colour to a theme and will be wrong in the other one. Membership is decided by
          the authored value rather than by which file it came from, so a semantic token holding a
          raw hex appears here — which is the rule being bent, made visible.
        </p>
        <Show when={tokens().length} fallback={<p class={s.unread}>not read yet — this runs on the client</p>}>
          <div class={s.count}>{colours("palette").length} colours</div>
          <TokenGrid tokens={colours("palette")} />
        </Show>
      </Case>

      <Case title="Semantic" note="tier two — the only tier a component sees">
        <p class={s.caseNote}>
          Each row shows what it points at and what that resolves to under the theme currently
          stamped. Switch the control in the header and the resolved value changes while the
          pointer does not — which is the whole of what the two tiers buy.
        </p>
        <Show when={tokens().length} fallback={<p class={s.unread}>not read yet — this runs on the client</p>}>
          <div class={s.count}>{colours("semantic").length} colours</div>
          <TokenGrid tokens={colours("semantic")} showPointer />
        </Show>
      </Case>

      <Case title="Scale" note="everything that is not a colour">
        <p class={s.caseNote}>
          Size, spacing, radius, duration, weight, tracking, elevation, stacking order. Split out
          because a duration drawn as a swatch is a picture of nothing. Membership is decided by
          whether the resolved value parses as a colour, so a token moves group by changing what
          it holds rather than by being relisted.
        </p>
        <Show when={tokens().length} fallback={<p class={s.unread}>not read yet — this runs on the client</p>}>
          <div class={s.scroller}>
            <table class={s.audit}>
              <thead>
                <tr><th scope="col">Token</th><th scope="col">Authored</th><th scope="col">Resolved</th></tr>
              </thead>
              <tbody>
                <For each={scales()}>
                  {(t) => (
                    <tr>
                      <td class={s.mono}>{t.name}</td>
                      <td class={s.mono}>{t.authored}</td>
                      <td class={s.mono}>{t.resolved}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Case>
    </Section>
  );
}
