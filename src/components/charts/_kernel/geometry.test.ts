import { describe, expect, it } from "vitest";
import { categorical, radiusFor } from "./encode";
import {
  circular,
  columns,
  force,
  hopsFrom,
  tiered,
  type GraphInput,
} from "./layout";
import { cose } from "./layout-cose";
import { linear } from "./scale";

const graph: GraphInput = {
  nodes: [
    { id: "a", group: "first" },
    { id: "b", group: "second" },
    { id: "c", group: "third" },
  ],
  edges: [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
  ],
  width: 480,
  height: 320,
};
describe("chart geometry contracts", () => {
  it("encodes area linearly, with bounded radius", () => {
    expect(radiusFor(25, [0, 100], [0, 10])).toBe(5);
    expect(radiusFor(-10, [0, 100], [0, 10])).toBe(0);
    expect(radiusFor(200, [0, 100], [0, 10])).toBe(10);
  });
  it("does not recycle categorical identities or accept fractional slots", () => {
    expect(new Set([0, 1, 2, 3].map(categorical)).size).toBe(4);
    for (const index of [-1, 0.5, 4, Infinity])
      expect(categorical(index)).toBeNull();
  });
  it("centers a constant domain and allows inverted pixel ranges", () => {
    expect(linear([4, 4], [0, 100])(4)).toBe(50);
    expect(linear([0, 10], [100, 0])(2)).toBe(80);
  });
  it("produces stable force positions and lets a supplied pin win", () => {
    expect(force(graph)).toEqual(force(graph));
    const at = { x: 111, y: 22 };
    expect(force({ ...graph, pins: new Map([["a", at]]) }).get("a")).toEqual(
      at,
    );
    expect(circular({ ...graph, pins: new Map([["a", at]]) }).get("a")).toEqual(
      at,
    );
  });
  it("keeps groups omitted from a requested tier order", () => {
    const placement = tiered(graph, ["second"]);
    expect([...placement.keys()]).toEqual(["b", "a", "c"]);
    expect(placement.get("b")!.x).toBeLessThan(placement.get("a")!.x);
  });
  it("walks graph distance in both directions", () => {
    expect([...hopsFrom(graph, "c")]).toEqual([
      ["c", 0],
      ["b", 1],
      ["a", 2],
    ]);
  });
  it("orders flow dependencies, while cycles still stay inside the layout", () => {
    const placement = columns(graph);
    expect(placement.get("a")!.x).toBeLessThan(placement.get("b")!.x);
    expect(placement.get("b")!.x).toBeLessThan(placement.get("c")!.x);
    const cyclic = columns({
      ...graph,
      edges: [...graph.edges, { from: "c", to: "a" }],
    });
    for (const point of cyclic.values()) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(graph.width);
    }
  });
  it("fits deterministic CoSE output and restores the global random source", () => {
    const random = Math.random;
    const first = cose(graph, { quality: "draft" });
    expect(Math.random).toBe(random);
    expect(cose(graph, { quality: "draft" })).toEqual(first);
    for (const point of first.values()) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(graph.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(graph.height);
    }
  });
  it("handles empty, single, dangling, and edge-like node identifiers", () => {
    expect(cose({ ...graph, nodes: [], edges: [] }).size).toBe(0);
    expect(
      cose({ ...graph, nodes: [{ id: "only" }], edges: [] }).get("only"),
    ).toEqual({
      x: 240,
      y: 160,
    });
    const result = cose({
      ...graph,
      nodes: [{ id: "edge-0" }, { id: "other" }],
      edges: [
        { from: "edge-0", to: "other" },
        { from: "ghost", to: "other" },
      ],
    });
    expect([...result.keys()]).toEqual(["edge-0", "other"]);
  });
});
