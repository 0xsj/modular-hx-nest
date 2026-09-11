import cytoscape from "cytoscape";
import { px } from "./scale";
import type { GraphInput, Placement } from "./layout";

/** Mulberry32 keeps the generator's arithmetic repeatable and its output in
 *  [0, 1). Overwatch's earlier signed-LCG fixture bug is why this choice matters:
 *  negative samples produced nonexistent endpoints that were silently skipped. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** CoSE computes positions headlessly; GraphFrame owns the SVG and text.
 *
 *  The pinned engine uses Math.random internally. Scope a seeded replacement to
 *  its synchronous run and restore it in finally, including failure paths.
 *  The layoutstop assertion is an upgrade guard: this adapter would need a
 *  different isolation strategy if the engine began yielding during layout.
 *  Tests check repeatable positions and restoration of the original function.
 */
export function cose(
  input: GraphInput,
  options?: { seed?: number; quality?: "draft" | "default" | "proof" },
): Placement {
  const { nodes, edges, width, height } = input;
  if (!nodes.length) return new Map();
  const ids = new Set(nodes.map((node) => node.id));
  const used = new Set(ids);
  const connections = edges
    .filter((edge) => ids.has(edge.from) && ids.has(edge.to))
    .map((edge, index) => {
      let id = `edge-${index}`;
      while (used.has(id)) id = `_${id}`;
      used.add(id);
      return { data: { id, source: edge.from, target: edge.to } };
    });
  const cy = cytoscape({
    headless: true,
    styleEnabled: false,
    elements: [
      ...nodes.map((node) => ({ data: { id: node.id } })),
      ...connections,
    ],
  });
  const real = Math.random;
  try {
    const layout = cy.layout({
      name: "cose",
      animate: false,
      randomize: true,
      fit: false,
      boundingBox: { x1: 0, y1: 0, w: width, h: height },
      nodeOverlap: 12,
      idealEdgeLength: () => 70,
      componentSpacing: 60,
      numIter:
        options?.quality === "proof"
          ? 2500
          : options?.quality === "draft"
            ? 400
            : 1200,
    } as cytoscape.LayoutOptions);
    let stopped = false;
    layout.on("layoutstop", () => {
      stopped = true;
    });
    Math.random = mulberry32(options?.seed ?? 0x9e3779b9);
    layout.run();
    if (!stopped)
      throw new Error(
        "CoSE must settle synchronously for scoped deterministic randomness.",
      );

    // Headless CoSE may place disconnected components outside boundingBox.
    // Fit the completed geometry uniformly, preserving its relative distances.
    const points = cy
      .nodes()
      .map((node) => ({ id: node.id(), ...node.position() }));
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const scale = Math.min(
      Math.max(1, width - 64) / Math.max(1, maxX - minX),
      Math.max(1, height - 64) / Math.max(1, maxY - minY),
    );
    const out: Placement = new Map(
      points.map((point) => [
        point.id,
        {
          x: px(width / 2 + (point.x - (minX + maxX) / 2) * scale),
          y: px(height / 2 + (point.y - (minY + maxY) / 2) * scale),
        },
      ]),
    );
    if (input.pins)
      for (const [id, at] of input.pins) if (ids.has(id)) out.set(id, at);
    return out;
  } finally {
    Math.random = real;
    cy.destroy();
  }
}
