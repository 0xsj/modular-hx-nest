import { categorical } from "~/components/charts/_kernel/encode";
import type { Cell } from "~/components/charts/matrix";

/* Deterministic fixtures. `Math.random` would make every render a different
   picture, which is exactly the property the layouts are built to avoid — a
   demo that reshuffles cannot show that the layout does not.

   Warmed by three steps before the first value is handed out. A bare LCG
   returns `seed * a mod m / m` first, which for a small seed is a small number
   — the matrix below seeded from string lengths and every cell came back under
   0.22, so the whole grid rendered `unattempted` and the coverage ratio said
   0%. The chart was right and the fixture was lying to it. */
const rnd = (seed: number) => {
  /* mulberry32, and NOT the LCG this was. `Math.imul(s, 48271) % 2147483647`
     returns a signed intermediate, so it goes negative and stays there — every
     value after that was below zero, `Math.floor(r() * n)` produced negative
     indices, and the renderer silently skipped every edge pointing at a node
     that did not exist. The demo graphs were missing about half their edges and
     nothing said so. */
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A hash, not a length. Two strings the same length are not the same string,
 *  and seeding from `.length` gave the matrix five identical columns. */
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const volcano = (() => {
  const r = rnd(7);
  return Array.from({ length: 240 }, (_, i) => {
    const x = (r() - 0.5) * 7;
    return {
      id: `g${i}`,
      x,
      y: Math.abs(x) * r() * 1.5 + r() * 0.6,
      label: `GENE${i}`,
    };
  });
})();

export const bubbles = (() => {
  const r = rnd(11);
  const cats = ["KEGG", "Reactome", "GO"];
  return Array.from({ length: 26 }, (_, i) => ({
    id: `t${i}`,
    x: (r() - 0.4) * 5,
    y: r() * 4,
    weight: Math.round(r() * 90) + 8,
    category: cats[i % 3],
    label: `term ${i}`,
  }));
})();

export const bars = [
  { id: "alb", label: "ALB", value: 148 },
  { id: "il6", label: "IL6", value: 141 },
  { id: "tnf", label: "TNF", value: 139 },
  { id: "ins", label: "INS", value: 132 },
  { id: "akt1", label: "AKT1", value: 128 },
  { id: "il1b", label: "IL1B", value: 121 },
  { id: "vegfa", label: "VEGFA", value: 118 },
  { id: "tp53", label: "TP53", value: 112 },
  { id: "jun", label: "JUN", value: 108 },
  { id: "tlr4", label: "TLR4", value: 101 },
];

export const ASSETS = [
  "assets.example",
  "cdn.example",
  "legacy.example",
  "198.51.100.0/24",
  "AS64511",
  "*.example",
];
export const CHECKS = [
  "TLS expiry",
  "open ports",
  "subdomains",
  "WHOIS",
  "headers",
];
export const cell = (row: string, column: string): Cell => {
  // An ASN has no TLS certificate — decisions/0011's own worked example, and
  // the reason the `na` state exists at all.
  if (row.startsWith("AS") && (column === "TLS expiry" || column === "headers"))
    return { state: "na" };
  if (row.includes("/24") && column === "TLS expiry") return { state: "na" };
  const r = rnd(hash(`${row}|${column}`))();
  if (r < 0.22) return { state: "unattempted" };
  if (r < 0.38) return { state: "absent" };
  return { state: "value", value: Math.round(r * 100) };
};

export const net = (n: number, seed: number, extra = 1.6) => {
  const r = rnd(seed);
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `n${i}`,
    label: `N${i}`,
    group: i % 3,
    size: 5 + Math.round(r() * 4),
    fill: categorical(i % 4),
  }));
  const edges = Array.from({ length: Math.round(n * extra) }, () => {
    const a = Math.floor(r() * n);
    const b = Math.floor(r() * n);
    return { from: `n${a}`, to: `n${b === a ? (b + 1) % n : b}` };
  });
  return { nodes, edges };
};

export const star = (() => {
  const r = rnd(5);
  const nodes: {
    id: string;
    label: string;
    size: number;
    fill: string | null;
  }[] = [{ id: "root", label: "Northbeam", size: 10, fill: "var(--chart-3)" }];
  const edges: { from: string; to: string }[] = [];
  for (let i = 0; i < 12; i++) {
    nodes.push({
      id: `a${i}`,
      label: `hop1-${i}`,
      size: 5,
      fill: categorical(0),
    });
    edges.push({ from: "root", to: `a${i}` });
    if (r() > 0.55) {
      nodes.push({
        id: `b${i}`,
        label: `hop2-${i}`,
        size: 4,
        fill: categorical(1),
      });
      edges.push({ from: `a${i}`, to: `b${i}` });
    }
  }
  return { nodes, edges };
})();

export const bipartite = {
  nodes: [
    ...["lovastatin", "luteolin", "ICI", "cyclovalone"].map((l, i) => ({
      id: `c${i}`,
      label: l,
      group: 0,
      shape: "hexagon" as const,
      fill: categorical(2),
    })),
    ...["CD14", "NOD2", "CYP1", "TLR4"].map((l, i) => ({
      id: `t${i}`,
      label: l,
      group: 1,
      shape: "square" as const,
      fill: categorical(0),
    })),
  ],
  edges: [
    { from: "c0", to: "t0" },
    { from: "c1", to: "t0" },
    { from: "c1", to: "t2" },
    { from: "c2", to: "t1" },
    { from: "c3", to: "t3" },
    { from: "c0", to: "t3" },
  ],
};

export const correlation = (() => {
  const r = rnd(23);
  const ids = [
    "METTL3",
    "METTL14",
    "YTHDF1",
    "YTHDF2",
    "IGF2BP1",
    "RBMX",
    "CPSF1",
    "PCF11",
  ];
  const nodes = ids.map((id, i) => ({
    id,
    label: id,
    size: 6,
    fill: categorical(i % 4),
  }));
  const edges: { from: string; to: string; signed: number }[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const v = r() * 2 - 1;
      if (Math.abs(v) > 0.45)
        edges.push({ from: ids[i], to: ids[j], signed: v });
    }
  return { nodes, edges };
})();
