import { describe, expect, it } from "vitest";
import {
  decodeDashboardLayout,
  editDashboardLayout,
  type DashboardLayout,
  type GridEdit,
} from "./model";

const one = { id: "a", x: 3, y: 5, width: 4, height: 5 };
describe("saved dashboard geometry", () => {
  it("accepts empty layouts and unknown widget IDs without inventing replacements", () => {
    expect(decodeDashboardLayout([])).toMatchObject({ ok: true, value: [] });
    expect(
      decodeDashboardLayout([{ ...one, id: "removed-plugin" }]),
    ).toMatchObject({ ok: true });
  });
  it.each([
    null,
    {},
    [one, one],
    [{ ...one, x: -1 }],
    [{ ...one, y: Infinity }],
    [{ ...one, width: 10 }],
    [{ ...one, height: 3 }],
    [{ ...one, y: 198 }],
    [one, { ...one, id: "b" }],
  ])("rejects malformed, overlapping or out-of-bounds input: %j", (value) => {
    expect(decodeDashboardLayout(value).ok).toBe(false);
  });
  it.each<GridEdit>([
    "left",
    "right",
    "up",
    "down",
    "wider",
    "narrower",
    "taller",
    "shorter",
  ])("supports %s without mutating the original", (action) => {
    const layout = Object.freeze([Object.freeze(one)]);
    const next = editDashboardLayout(layout, "a", action);
    expect(next).not.toEqual(layout);
    expect(decodeDashboardLayout(next).ok).toBe(true);
    expect(layout).toEqual([one]);
  });
  it("refuses occupied cells, grid edges, and unknown IDs", () => {
    const layout: DashboardLayout = [
      { ...one, x: 0, y: 0, width: 6 },
      { ...one, id: "b", x: 6, y: 0, width: 6 },
    ];
    for (const action of ["left", "up", "right", "wider"] as const)
      expect(editDashboardLayout(layout, "a", action)).toBe(layout);
    expect(editDashboardLayout(layout, "missing", "down")).toBe(layout);
  });
});
