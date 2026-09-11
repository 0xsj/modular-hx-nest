import { err, invalid, ok, type Result } from "~/lib/kernel";

export type GridItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type DashboardLayout = readonly GridItem[];
export type GridEdit =
  | "left"
  | "right"
  | "up"
  | "down"
  | "wider"
  | "narrower"
  | "taller"
  | "shorter";
export const GRID = {
  columns: 12,
  minWidth: 3,
  minHeight: 4,
  maxHeight: 16,
  maxRows: 200,
  maxItems: 32,
} as const;
const overlaps = (a: GridItem, b: GridItem) =>
  a.id !== b.id &&
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
function bounded(item: GridItem) {
  return (
    [item.x, item.y, item.width, item.height].every(Number.isSafeInteger) &&
    item.x >= 0 &&
    item.y >= 0 &&
    item.width >= GRID.minWidth &&
    item.x + item.width <= GRID.columns &&
    item.height >= GRID.minHeight &&
    item.height <= GRID.maxHeight &&
    item.y + item.height <= GRID.maxRows
  );
}
export function decodeDashboardLayout(value: unknown): Result<DashboardLayout> {
  const bad = () =>
    err(
      invalid(
        "The saved dashboard arrangement is invalid.",
        {},
        { type: "dashboard_layout" },
      ),
    );
  if (!Array.isArray(value) || value.length > GRID.maxItems) return bad();
  const items: GridItem[] = [],
    ids = new Set<string>();
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !item.id ||
      item.id.length > 128 ||
      ids.has(item.id)
    )
      return bad();
    const next = {
      id: item.id,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };
    if (!bounded(next) || items.some((other) => overlaps(next, other)))
      return bad();
    ids.add(item.id);
    items.push(next);
  }
  return ok(items);
}
/** Refuse an occupied destination instead of overlapping or moving other cards. */
export function editDashboardLayout(
  layout: DashboardLayout,
  id: string,
  edit: GridEdit,
): DashboardLayout {
  const current = layout.find((item) => item.id === id);
  if (!current) return layout;
  const next = { ...current };
  switch (edit) {
    case "left":
      next.x--;
      break;
    case "right":
      next.x++;
      break;
    case "up":
      next.y--;
      break;
    case "down":
      next.y++;
      break;
    case "wider":
      next.width++;
      break;
    case "narrower":
      next.width--;
      break;
    case "taller":
      next.height++;
      break;
    case "shorter":
      next.height--;
      break;
  }
  if (!bounded(next) || layout.some((other) => overlaps(next, other)))
    return layout;
  return layout.map((item) => (item.id === id ? next : item));
}
