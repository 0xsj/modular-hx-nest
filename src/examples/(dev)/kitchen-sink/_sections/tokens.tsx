import { createMemo, For } from "solid-js";
import { cn } from "~/lib/kernel";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import type { Ramp } from "../_components/swatches";
import { Swatches } from "../_components/swatches";
import type { Check, Theme } from "../_lib/tokens";
import { audit } from "../_lib/tokens";
const INK = ["--ink", "--ink-2", "--ink-3", "--ink-4"];
const SURFACES = [
  "--surface-ground",
  "--surface-rail",
  "--surface-sunk",
  "--surface-panel",
  "--surface-panel-2",
  "--surface-raised",
];
const ACCENT = [
  "--accent",
  "--accent-dim",
  "--fill",
  "--fill-hover",
  "--warn",
  "--crit",
  "--info",
];
const PRIMITIVE: Ramp[] = [
  {
    name: "neutral",
    tokens: [
      "--neutral-0",
      "--neutral-25",
      "--neutral-50",
      "--neutral-100",
      "--neutral-150",
      "--neutral-200",
      "--neutral-300",
      "--neutral-400",
      "--neutral-500",
      "--neutral-550",
      "--neutral-600",
      "--neutral-650",
      "--neutral-700",
      "--neutral-750",
      "--neutral-800",
      "--neutral-850",
      "--neutral-900",
      "--neutral-925",
      "--neutral-950",
      "--neutral-975",
      "--neutral-1000",
      "--neutral-max",
    ],
  },
  {
    name: "green",
    tokens: [
      "--green-300",
      "--green-400",
      "--green-500",
      "--green-600",
      "--green-700",
      "--green-800",
      "--green-900",
      "--green-tint-dark",
      "--green-line-dark",
      "--green-tint-light",
      "--green-line-light",
    ],
  },
  {
    name: "amber",
    tokens: [
      "--amber-400",
      "--amber-800",
      "--amber-tint-dark",
      "--amber-line-dark",
      "--amber-tint-light",
      "--amber-line-light",
    ],
  },
  {
    name: "red",
    tokens: [
      "--red-400",
      "--red-800",
      "--red-tint-dark",
      "--red-line-dark",
      "--red-tint-light",
      "--red-line-light",
    ],
  },
  {
    name: "blue — the accent family",
    tokens: [
      "--blue-300",
      "--blue-400",
      "--blue-500",
      "--blue-600",
      "--blue-700",
      "--blue-800",
      "--blue-900",
      "--blue-tint-dark",
      "--blue-line-dark",
      "--blue-tint-light",
      "--blue-line-light",
    ],
  },
  {
    name: "alpha",
    tokens: [
      "--alpha-w-045",
      "--alpha-w-07",
      "--alpha-w-075",
      "--alpha-w-12",
      "--alpha-w-20",
      "--alpha-b-035",
      "--alpha-b-06",
      "--alpha-b-08",
      "--alpha-b-13",
      "--alpha-b-22",
    ],
  },
];
const SEMANTIC: Ramp[] = [
  {
    name: "surface",
    tokens: [...SURFACES, "--surface-hover", "--surface-hover-2"],
  },
  {
    name: "line",
    tokens: ["--line", "--line-strong", "--line-heavy"],
  },
  {
    name: "ink",
    tokens: INK,
  },
  {
    name: "accent + fill",
    tokens: [
      "--accent",
      "--accent-dim",
      "--accent-tint",
      "--accent-line",
      "--fill",
      "--fill-hover",
      "--fill-ink",
    ],
  },
  {
    name: "status",
    tokens: [
      "--warn",
      "--warn-tint",
      "--warn-line",
      "--crit",
      "--crit-tint",
      "--crit-line",
      "--info",
      "--info-tint",
      "--info-line",
    ],
  },
  {
    name: "scrim",
    tokens: ["--scrim"],
  },
  {
    name: "shadow",
    kind: "shadow",
    tokens: ["--shadow"],
  },
];
const SPACE = [
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-7",
  "--space-8",
  "--space-9",
  "--space-10",
  "--space-11",
  "--space-12",
];
const RADIUS = [
  "--radius-1",
  "--radius-2",
  "--radius-3",
  "--radius-4",
  "--radius-pill",
];
const CONTROL = ["--control-sm", "--control-md", "--control-lg"];
function Chips(props: { tokens: string[] }) {
  return (
    <div class={s.swatches}>
      <For each={props.tokens}>
        {(t) => (
          <div class={s.swatch}>
            <div
              class={s.swatchChip}
              style={{
                background: `var(${t})`,
              }}
            />
            <div class={s.swatchLabel}>{t}</div>
          </div>
        )}
      </For>
    </div>
  );
}
function Audit(props: { theme: Theme; rows: Check[] }) {
  const failed = createMemo(() => props.rows.filter((r) => !r.pass).length);
  return (
    <div>
      <div class={s.auditHead}>
        <span class={s.auditTheme}>{props.theme}</span>
        <span class={cn(s.verdict, failed() ? s.bad : s.ok)}>
          {(() => {
            const _failedSnapshot = failed();
            return _failedSnapshot
              ? `${_failedSnapshot} below threshold`
              : `${props.rows.length} pairs pass`;
          })()}
        </span>
      </div>
      <table class={s.audit}>
        <thead>
          <tr>
            <th scope="col">Foreground</th>
            <th scope="col">On</th>
            <th scope="col" class={s.num}>
              Ratio
            </th>
            <th scope="col" class={s.num}>
              Needs
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(r) => (
              <tr>
                <td>{r.fg}</td>
                <td>{r.bg}</td>
                <td class={cn(s.num, r.pass ? s.pass : s.fail)}>
                  {r.pass ? "✓" : "✕"} {r.ratio.toFixed(2)}:1
                </td>
                <td class={cn(s.num, s.needs)}>{r.large ? "3.00" : "4.50"}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
export function TokensSection() {
  const checks = audit();
  return (
    <Section
      id="tokens"
      title="Tokens"
      blurb="Every value a component may read. The audit below is computed from the stylesheet at build time — this page fails visibly when a token stops clearing its contrast threshold, which is the class of defect that survives a visual review because the eye has no scale for a ratio."
    >
      <Case title="Contrast audit" note="computed from styles/tokens/*.css">
        <div class={s.audits}>
          <Audit theme="dark" rows={checks.dark} />
          <Audit theme="light" rows={checks.light} />
        </div>
        <p class={s.limits}>
          <strong>What this does not check.</strong> Only flat hex values
          resolve, so a pair involving a tint scores <code>0.00</code> rather
          than a guess. Only <code>:root</code> and{" "}
          <code>:root[data-theme=&quot;light&quot;]</code> are read —{" "}
          <code>semantic.css</code> states the light palette a second time under{" "}
          <code>@media (prefers-color-scheme: light)</code>, identical today,
          and nothing here would notice the day the two drift. Composited colour
          is out of reach entirely: <code>--surface-hover</code> over a panel is
          a real background, and an alpha over a hex is not a hex. And the pair
          list is a promise rather than a discovery — a semantic colour added
          without its pair is a colour that stopped being audited.
        </p>
      </Case>

      <Case title="Ink" note="monotonic in prominence in both themes">
        <For each={INK}>
          {(t) => (
            <Row label={t}>
              <span
                style={{
                  color: `var(${t})`,
                }}
              >
                A source said something. That is all that is ever held.
              </span>
            </Row>
          )}
        </For>
      </Case>

      <Case title="Surfaces" note="ground is furthest back; raised is nearest">
        <Chips tokens={SURFACES} />
      </Case>

      <Case
        title="Accent and status"
        note="the accent is also the healthy state, so nothing is hue alone"
      >
        <Chips tokens={ACCENT} />
        <Row label="three states">
          <span
            style={{
              color: "var(--accent)",
            }}
          >
            ● found
          </span>
          <span
            style={{
              color: "var(--ink-3)",
            }}
          >
            — none
          </span>
          <span
            style={{
              color: "var(--ink-4)",
            }}
          >
            ·· never checked
          </span>
        </Row>
      </Case>

      <Case
        title="Palette"
        note="raw values — the only layer allowed to hold one"
      >
        <Swatches ramps={PRIMITIVE} />
      </Case>

      <Case
        title="Semantic"
        note="what a component reads; the value under each chip is the resolved var() chain"
      >
        <Swatches ramps={SEMANTIC} />
      </Case>

      <Case title="Scale" note="space, radius and control height">
        <div class={s.scale}>
          <For each={SPACE}>
            {(t) => (
              <div class={s.scaleRow}>
                <span class={s.mono}>{t}</span>
                <span class={s.mono} />
                <div
                  class={s.scaleBar}
                  style={{
                    "inline-size": `var(${t})`,
                  }}
                />
              </div>
            )}
          </For>
        </div>
        <div class={s.swatches}>
          <For each={RADIUS}>
            {(t) => (
              <div
                class={s.swatch}
                style={{
                  border: "none",
                  background: "transparent",
                }}
              >
                <div
                  class={s.scaleBox}
                  style={{
                    "border-radius": `var(${t})`,
                  }}
                />
                <div class={s.swatchLabel}>{t}</div>
              </div>
            )}
          </For>
        </div>
        <For each={CONTROL}>
          {(t) => (
            <Row label={t}>
              <div
                class={s.scaleControl}
                style={{
                  "block-size": `var(${t})`,
                }}
              />
            </Row>
          )}
        </For>
      </Case>
    </Section>
  );
}
