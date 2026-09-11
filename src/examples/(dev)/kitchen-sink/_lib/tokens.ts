import primitives from "~/styles/tokens/primitives.css?raw";
import semantic from "~/styles/tokens/semantic.css?raw";
/* The audit reads the STYLESHEET, not the render.
 *
 * That is the trade it makes. Parsing the source resolves every `var()` chain
 * exactly and needs no browser, so it runs at build time and fails the page
 * visibly — contrast is a ratio and the eye has no scale for it, which is why
 * this class of defect survives visual review and clusters on 10px labels.
 *
 * What it therefore CANNOT see, stated because a check that lists only its
 * catches gets read as a guarantee:
 *   · Anything that is not a flat hex. Tints are `rgb(… / 0.10)`, so a pair
 *     involving one resolves to null and scores 0 rather than lying.
 *   · The `@media (prefers-color-scheme: light)` block. `semantic.css` states
 *     the light palette twice — once there, once under `[data-theme="light"]`
 *     — and only the second is read. Identical today; nothing here would
 *     notice the day they drift.
 *   · Composited colour. `--surface-hover` over a panel is a real background a
 *     component paints text on, and an alpha over a hex is not a hex.
 *   · Whatever pair is not in PAIRS. The list is a promise, not a discovery. */

export type Theme = "dark" | "light";
export type Check = {
  fg: string;
  bg: string;
  ratio: number;
  large: boolean;
  pass: boolean;
};

const HEX = /^#([0-9a-f]{6})$/i;

function block(css: string, selector: RegExp): string {
  const m = selector.exec(css);
  if (!m) return "";
  const from = css.indexOf("{", m.index) + 1;
  return css.slice(from, css.indexOf("}", from));
}

function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of body.split(";")) {
    const [name, ...rest] = line.split(":");
    if (!name?.trim().startsWith("--")) continue;
    out.set(name.trim(), rest.join(":").trim());
  }
  return out;
}

/** Walks the `var()` chain to a literal. Returns null rather than a guess when
 *  it ends anywhere but a six-digit hex — a scored 0 is a visible failure and a
 *  guessed ratio is a passing row that means nothing. `seen` is not paranoia:
 *  a token that refers to itself would otherwise spin here at build time. */
function resolve(
  name: string,
  semantic: Map<string, string>,
  palette: Map<string, string>,
): string | null {
  const seen = new Set<string>();
  let value = semantic.get(name) ?? palette.get(name) ?? null;
  while (value && value.startsWith("var(")) {
    const ref = value.slice(4, value.indexOf(")")).trim();
    if (seen.has(ref)) return null;
    seen.add(ref);
    value = semantic.get(ref) ?? palette.get(ref) ?? null;
  }
  return value && HEX.test(value) ? value : null;
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const chan = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Foreground / background pairs the design actually promises, and whether the
 *  text at that pair is large (3:1) or normal (4.5:1). Adding a semantic colour
 *  without adding its pair here is how a ladder quietly stops being audited. */
const PAIRS: ReadonlyArray<[string, string, boolean]> = [
  ["--ink", "--surface-ground", false],
  ["--ink-2", "--surface-ground", false],
  ["--ink-3", "--surface-ground", false],
  ["--ink-4", "--surface-ground", false],
  ["--ink", "--surface-panel", false],
  ["--ink-2", "--surface-panel", false],
  ["--ink-3", "--surface-panel", false],
  ["--ink-4", "--surface-panel", false],
  ["--accent", "--surface-panel", false],
  ["--warn", "--surface-panel", false],
  ["--crit", "--surface-panel", false],
  ["--info", "--surface-panel", false],
  ["--fill-ink", "--fill", false],
];

export function audit(): Record<Theme, Check[]> {
  const palette = declarations(block(primitives, /:root\s*\{/));
  const themes: Record<Theme, Map<string, string>> = {
    dark: declarations(block(semantic, /:root\s*\{/)),
    light: declarations(block(semantic, /:root\[data-theme="light"\]\s*\{/)),
  };

  const out = {} as Record<Theme, Check[]>;
  for (const theme of ["dark", "light"] as const) {
    out[theme] = PAIRS.map(([fg, bg, large]) => {
      const a = resolve(fg, themes[theme], palette);
      const b = resolve(bg, themes[theme], palette);
      const ratio = a && b ? contrast(a, b) : 0;
      return { fg, bg, ratio, large, pass: ratio >= (large ? 3 : 4.5) };
    });
  }
  return out;
}
