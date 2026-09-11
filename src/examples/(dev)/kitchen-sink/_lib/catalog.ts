/** Serializable metadata; component references stay in the server registry. */
export const CATALOG = [
  {
    id: "tokens",
    label: "Tokens",
    group: "Foundations",
    description: "Color, spacing, borders, elevation, and motion.",
  },
  {
    id: "typography",
    label: "Type scale",
    group: "Foundations",
    description: "The font families, weights, and sizes behind the system.",
  },
  {
    id: "layout",
    label: "Layout",
    group: "Foundations",
    description: "Spacing and flow with Box, Flex, Container, and Separator.",
  },
  {
    id: "type-components",
    label: "Typography",
    group: "Primitives",
    description: "Headings, body text, and small section labels.",
  },
  {
    id: "forms",
    label: "Forms",
    group: "Primitives",
    description: "Labelled inputs, choices, buttons, and numeric sliders.",
  },
  {
    id: "pickers",
    label: "Pickers",
    group: "Primitives",
    description:
      "Searchable single and multiple choices, dates, and date ranges.",
  },
  {
    id: "display",
    label: "Display",
    group: "Primitives",
    description: "Panels, stats, badges, avatars, and structured details.",
  },
  {
    id: "feedback",
    label: "Feedback",
    group: "Primitives",
    description: "Messages, errors, skeletons, and measured progress.",
  },
  {
    id: "navigation",
    label: "Navigation",
    group: "Primitives",
    description: "Breadcrumbs, tabs, links, and pagination.",
  },
  {
    id: "disclosure",
    label: "Disclosure",
    group: "Primitives",
    description: "Single and multiple accordions with keyboard navigation.",
  },
  {
    id: "overlays",
    label: "Overlays",
    group: "Primitives",
    description: "Dialogs, confirmations, menus, popovers, and tooltips.",
  },
  {
    id: "utility",
    label: "Utility",
    group: "Primitives",
    description: "Icons, accessible names, hidden text, and portals.",
  },
  {
    id: "cards",
    label: "Cards",
    group: "Compositions",
    description: "Records, metrics, settings, selectable choices, and media.",
  },
  {
    id: "tables",
    label: "Tables",
    group: "Compositions",
    description:
      "Semantic tables with sorting, selection, filtering, and paging.",
  },
  {
    id: "charts",
    label: "Charts",
    group: "Compositions",
    description:
      "Chart frames and legends, bars, and line series with data tables.",
  },
  {
    id: "statistical-charts",
    label: "Statistical charts",
    group: "Compositions",
    description:
      "Volcano and bubble plots, ranked bars, matrices, and color scales.",
  },
  {
    id: "networks",
    label: "Network diagrams",
    group: "Compositions",
    description:
      "Eleven graph presets: force, radial, circular, flow, and more.",
  },
  {
    id: "patterns",
    label: "Page patterns",
    group: "Compositions",
    description:
      "Page headers, collection toolbars, and common screen recipes.",
  },
  {
    id: "shells",
    label: "Shells",
    group: "Compositions",
    description:
      "Standard and rail layouts, contextual sidebars, and authentication frames.",
  },
  {
    id: "workspaces",
    label: "Interactive workspaces",
    group: "Compositions",
    description:
      "Freeform canvases and editable dashboard grids, with keyboard alternatives.",
  },
  {
    id: "chrome",
    label: "Preferences",
    group: "Runtime",
    description: "Theme, density, and application identity.",
  },
  {
    id: "data",
    label: "Data & failures",
    group: "Runtime",
    description: "The port, fixtures, cached reads, and failure presentation.",
  },
] as const;
export type SectionId = (typeof CATALOG)[number]["id"];
export const CATALOG_GROUPS = [...new Set(CATALOG.map((entry) => entry.group))];
