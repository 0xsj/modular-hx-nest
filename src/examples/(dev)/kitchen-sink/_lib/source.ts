export type Source = { path: string; code: string };
const files = import.meta.glob("/src/components/**/*.{tsx,ts,css}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
export function readSources(rels: readonly string[]): Source[] {
  return rels.map((rel) => {
    const path = `/src/components/${rel}`,
      code = files[path];
    if (code === undefined)
      throw new Error(`Catalog source is missing: ${path}`);
    return { path: path.slice(1), code: code.trimEnd() };
  });
}
