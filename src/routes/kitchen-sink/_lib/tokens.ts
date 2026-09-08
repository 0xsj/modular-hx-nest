/* Reading the token layer out of the document that actually loaded it.
 *
 * The build this is ported from parsed `styles/tokens/*.css` off disk at build
 * time. This reads the CSSOM instead, and the difference is the claim each can
 * make: parsing the file proves what is written down, reading the cascade
 * proves it also LOADED, resolved, and won. The second is the failure worth
 * catching — a stylesheet can be perfect and imported in the wrong order.
 *
 * Both are ASSERTED and neither is MEASURED. Sampling a rendered pixel is a
 * different instrument and a different job; see
 * `protocols/render-verification.md`.
 *
 * No default export. A file under `src/routes` becomes a route if and only if
 * it has one, so the underscore directories are a convention and the missing
 * default is the mechanism. */

export type Tier = "palette" | "semantic";
export type Kind = "color" | "scale";
export type Theme = "dark" | "light";

export type Token = {
  name: string;
  /** The value as written — `#121212`, or `var(--neutral-1000)`. */
  authored: string;
  /** What the cascade resolved it to in the theme currently stamped. */
  resolved: string;
  /** Whether it POINTS at another token. Not which file it came from. */
  tier: Tier;
  /** What the value IS. Independent of tier: `--radius-2` is a scale token in
   *  the palette tier, and `--fill-ink` is a colour authored as a raw hex
   *  inside the semantic file — which is the two-tier rule being bent, and it
   *  surfaces here as a colour in the palette group rather than as nothing. */
  kind: Kind;
};

export type Check = {
  fg: string;
  bg: string;
  ratio: number;
  /** Large text clears at 3:1, normal at 4.5:1. Everything here is normal. */
  large: boolean;
  pass: boolean;
};

type Rgba = { r: number; g: number; b: number; a: number };

/** `#rgb`, `#rrggbb`, `rgb(r, g, b)` and `rgb(r g b / a)`. Anything else
 *  returns null and is counted as unparsed rather than silently scored. */
export function parseColor(raw: string): Rgba | null {
  const v = raw.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (!fn) return null;
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  const a = parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1;
  return { r: parts[0], g: parts[1], b: parts[2], a };
}

function luminance({ r, g, b }: Rgba): number {
  const chan = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

function contrast(fg: Rgba, bg: Rgba): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every custom property declared on `:root`, from every stylesheet.
 *
 *  Recurses through `@layer` and `@media`, because both wrap the rules we are
 *  after and neither is a CSSStyleRule. Derived rather than declared, so a
 *  token added to the stylesheet appears here without this file changing —
 *  which is the only version of this page that cannot go stale. */
export function collectTokens(): Token[] {
  const found = new Map<string, { name: string; authored: string; tier: Tier }>();

  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested) visit(nested);
      const style = (rule as CSSStyleRule).style;
      if (!style || (rule as CSSStyleRule).selectorText !== ":root") continue;
      for (const prop of Array.from(style)) {
        if (!prop.startsWith("--") || found.has(prop)) continue;
        const authored = style.getPropertyValue(prop).trim();
        found.set(prop, { name: prop, authored, tier: authored.startsWith("var(") ? "semantic" : "palette" });
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      /* A cross-origin sheet throws on access. None is expected here — and if
         one appears, its tokens are simply absent, which is why the counts are
         printed rather than described as complete. */
    }
  }

  const cs = getComputedStyle(document.documentElement);
  return [...found.values()]
    .map((t): Token => {
      const resolved = cs.getPropertyValue(t.name).trim();
      return { ...t, resolved, kind: parseColor(resolved) ? "color" : "scale" };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const INKS = ["--ink", "--ink-2", "--ink-3", "--ink-4", "--accent", "--warn", "--crit", "--info"];
export const GROUNDS = ["--surface-ground", "--surface-rail", "--surface-sunk", "--surface-panel", "--surface-panel-2", "--surface-raised"];

export type Audit = { dark: Check[]; light: Check[]; skipped: number };

/** Every ink against every ground, in BOTH themes, by stamping the attribute,
 *  reading, and restoring — synchronously, so nothing paints in between.
 *
 *  The full cross product, not a list of the pairs the design promises. A
 *  hand-written list is the stated limit of a contrast audit: a pair used on a
 *  real screen and absent from the list is unaudited and nothing detects it.
 *  The cost of removing that limit is that this includes pairs no screen will
 *  ever use, so a failing row is a prompt to check rather than proof of a
 *  defect — and saying which is the reader's job, not this function's. */
export function auditThemes(): Audit {
  const root = document.documentElement;
  const before = root.getAttribute("data-theme");
  const out: Audit = { dark: [], light: [], skipped: 0 };

  for (const theme of ["dark", "light"] as const) {
    root.setAttribute("data-theme", theme);
    const cs = getComputedStyle(root);
    for (const fg of INKS) {
      for (const bg of GROUNDS) {
        const a = parseColor(cs.getPropertyValue(fg));
        const b = parseColor(cs.getPropertyValue(bg));
        /* A translucent token cannot be scored without compositing it over
           whatever is behind, and what is behind is a screen's decision.
           Not scoring it is the honest answer; counting it is the reported one. */
        if (!a || !b || a.a < 1 || b.a < 1) { out.skipped++; continue; }
        const ratio = contrast(a, b);
        out[theme].push({ fg, bg, ratio, large: false, pass: ratio >= 4.5 });
      }
    }
    out[theme].sort((x, y) => x.ratio - y.ratio);
  }

  if (before === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", before);
  return out;
}

export function fontStacks() {
  const cs = getComputedStyle(document.documentElement);
  return {
    sans: cs.getPropertyValue("--font-sans").trim(),
    mono: cs.getPropertyValue("--font-mono").trim(),
    body: getComputedStyle(document.body).fontFamily,
  };
}
