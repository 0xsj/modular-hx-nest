import {
  choiceParam,
  integerParam,
  querySchema,
  textParam,
} from "~/lib/url-state";

export const collectionQuery = querySchema({
  q: textParam({ maxLength: 80 }),
  status: choiceParam(["all", "active", "paused", "archived"], "all"),
  sort: choiceParam(["name", "recent"], "name"),
  page: integerParam({ max: 10000 }),
  view: choiceParam(["table", "cards"], "table"),
});
export type CollectionState = typeof collectionQuery.defaults;
export const PAGE_SIZE = 6;
export type Project = {
  id: string;
  name: string;
  owner: string;
  status: "active" | "paused" | "archived";
  updated: string;
};

/** Public, local sample data. No backend or account state is represented. */
export const PROJECTS: readonly Project[] = [
  {
    id: "atlas",
    name: "Atlas",
    owner: "Platform",
    status: "active",
    updated: "2026-09-10",
  },
  {
    id: "beacon",
    name: "Beacon",
    owner: "Product",
    status: "active",
    updated: "2026-09-08",
  },
  {
    id: "cedar",
    name: "Cedar",
    owner: "Research",
    status: "paused",
    updated: "2026-08-28",
  },
  {
    id: "delta",
    name: "Delta",
    owner: "Platform",
    status: "active",
    updated: "2026-09-06",
  },
  {
    id: "ember",
    name: "Ember",
    owner: "Product",
    status: "archived",
    updated: "2026-07-14",
  },
  {
    id: "fjord",
    name: "Fjord",
    owner: "Research",
    status: "active",
    updated: "2026-09-09",
  },
  {
    id: "grove",
    name: "Grove",
    owner: "Platform",
    status: "active",
    updated: "2026-09-04",
  },
  {
    id: "harbor",
    name: "Harbor",
    owner: "Product",
    status: "paused",
    updated: "2026-08-30",
  },
  {
    id: "iris",
    name: "Iris",
    owner: "Research",
    status: "active",
    updated: "2026-09-05",
  },
  {
    id: "juniper",
    name: "Juniper",
    owner: "Platform",
    status: "archived",
    updated: "2026-07-29",
  },
  {
    id: "kite",
    name: "Kite",
    owner: "Product",
    status: "active",
    updated: "2026-09-02",
  },
  {
    id: "lumen",
    name: "Lumen",
    owner: "Research",
    status: "active",
    updated: "2026-09-07",
  },
  {
    id: "mesa",
    name: "Mesa",
    owner: "Platform",
    status: "paused",
    updated: "2026-08-22",
  },
  {
    id: "north",
    name: "North",
    owner: "Product",
    status: "active",
    updated: "2026-09-03",
  },
  {
    id: "orbit",
    name: "Orbit",
    owner: "Research",
    status: "archived",
    updated: "2026-07-20",
  },
  {
    id: "pine",
    name: "Pine",
    owner: "Platform",
    status: "active",
    updated: "2026-09-01",
  },
  {
    id: "quarry",
    name: "Quarry",
    owner: "Product",
    status: "paused",
    updated: "2026-08-25",
  },
  {
    id: "ridge",
    name: "Ridge",
    owner: "Research",
    status: "active",
    updated: "2026-08-31",
  },
];

export function selectProjects(state: CollectionState) {
  const search = state.q.toLowerCase();
  const matches = PROJECTS.filter(
    (project) =>
      (state.status === "all" || project.status === state.status) &&
      `${project.name} ${project.owner}`.toLowerCase().includes(search),
  );
  matches.sort((a, b) =>
    state.sort === "recent"
      ? b.updated.localeCompare(a.updated) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name),
  );
  return {
    total: matches.length,
    totalPages: Math.ceil(matches.length / PAGE_SIZE),
    rows: matches.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE),
  };
}
