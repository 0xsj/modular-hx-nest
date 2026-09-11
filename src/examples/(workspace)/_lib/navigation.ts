import {
  BookOpen,
  History,
  LayoutGrid,
  Network,
  TriangleAlert,
  Zap,
} from "~/components/utility";
import type { NavGroup } from "~/components/shells";

export const RECIPES = [
  {
    href: "/cookbook/session",
    label: "Session recovery",
    icon: History,
    description:
      "Resume an account-scoped draft after session expiry and reconcile the original save.",
    category: "Failure handling",
  },
  {
    href: "/cookbook/access",
    label: "Capabilities",
    icon: BookOpen,
    description:
      "Explain denied actions and handle permissions changing while a workspace is open.",
    category: "Failure handling",
  },
  {
    href: "/cookbook/jobs",
    label: "Long-running jobs",
    icon: Zap,
    description:
      "Follow imports and exports through disconnection, progress, and cancellation races.",
    category: "Interactive workspaces",
  },
  {
    href: "/cookbook/localization",
    label: "Localization",
    icon: BookOpen,
    description:
      "Exercise explicit formatting, long translated text, and right-to-left layouts.",
    category: "Working examples",
  },
  {
    href: "/cookbook/items",
    label: "Items",
    icon: LayoutGrid,
    description:
      "Browse, edit and recover a save with revision checks, durable drafts and interaction diagnostics.",
    category: "Working examples",
  },
  {
    href: "/cookbook/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    description:
      "Session data, server and cached reads, and an optimistic update.",
    category: "Working examples",
  },
  {
    href: "/cookbook/activity",
    label: "Activity",
    icon: History,
    description:
      "A working collection with filtering, pagination, and real empty states.",
    category: "Working examples",
  },
  {
    href: "/cookbook/url-state",
    label: "URL state",
    icon: BookOpen,
    description:
      "Share a collection view with typed search, filters, sorting, pagination, and browser history.",
    category: "Working examples",
  },
  {
    href: "/cookbook/editable-dashboard",
    label: "Editable dashboard",
    icon: LayoutGrid,
    description:
      "Arrange widgets with drag, resize, and keyboard controls. Save a layout in this browser.",
    category: "Interactive workspaces",
  },
  {
    href: "/cookbook/canvas",
    label: "Canvas",
    icon: Network,
    description:
      "Explore a freeform workspace with pan, zoom, movable items, and an inspector.",
    category: "Interactive workspaces",
  },
  {
    href: "/cookbook/live-updates",
    label: "Live updates",
    icon: Zap,
    description:
      "Targeted refresh, event bursts, and catching up after a disconnected stream.",
    category: "Interactive workspaces",
  },
  {
    href: "/cookbook/chaos",
    label: "Chaos",
    icon: Zap,
    description:
      "Apply failures, empty responses, and latency to the working examples.",
    category: "Failure handling",
  },
  {
    href: "/cookbook/resilience",
    label: "Resilience",
    icon: TriangleAlert,
    description:
      "Reject malformed data, handle late responses, and recover an uncertain save without losing the draft.",
    category: "Failure handling",
  },
  {
    href: "/cookbook/diagnostics",
    label: "Diagnostics",
    icon: History,
    description:
      "Inspect each interaction, request, decode, and recovery step without recording request contents.",
    category: "Failure handling",
  },
  {
    href: "/cookbook/failures",
    label: "Failures",
    icon: TriangleAlert,
    description:
      "Follow a failure through its kind, cause chain, and recovery policy.",
    category: "Failure handling",
  },
] as const;

export const APP_NAV: readonly NavGroup[] = [
  { items: [{ href: "/app", label: "Home", icon: LayoutGrid, exact: true }] },
];
export const COOKBOOK_NAV: readonly NavGroup[] = [
  {
    items: [
      { href: "/cookbook", label: "Start here", icon: BookOpen, exact: true },
      { href: "/cookbook/manual", label: "User manual", icon: BookOpen },
    ],
  },
  ...["Working examples", "Interactive workspaces", "Failure handling"].map(
    (label) => ({
      label,
      items: RECIPES.filter((recipe) => recipe.category === label),
    }),
  ),
];

export function workspaceArea(pathname: string): "app" | "cookbook" {
  return pathname === "/app" || pathname.startsWith("/app/")
    ? "app"
    : "cookbook";
}
