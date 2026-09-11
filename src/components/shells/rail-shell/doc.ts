/**
 * RailShell — two levels of navigation beside a content surface.
 *
 * § CONTRACT
 * RailShell accepts slots for an always-reachable section rail, contextual
 * sidebar, header, and content. It owns one main landmark and its skip target.
 * The sidebar can be controlled or locally toggled. A collapsed sidebar is
 * absent from keyboard navigation, not merely visually squeezed to zero.
 * At narrow widths, the rail stays visible and the contextual sidebar becomes
 * a disclosure above the content, with the same explicit toggle. No route,
 * account, role, query cache, or persistence is assumed by the composition.
 * NavigationRail composes a brand, section controls, and footer. RailLink is a
 * named icon link with tooltip, caller-supplied active state, and asChild for
 * a router link. The active section uses aria-current=true rather than claiming
 * an exact page. ContextSidebar supplies heading, description, nav, and footer.
 *
 * § MECHANICS
 * Adapted from Overwatch's 48px icon rail plus contextual sidebar. CSS grid and
 * container queries adapt to the shell's own available width, including gallery
 * previews. A local disclosure keeps navigation reachable without modal state.
 * AppShell remains the separate, simpler header-and-sidebar option.
 *
 * The gallery uses separate preview documents so its own main landmark and
 * providers cannot stand in for the shell's. Preference synchronization belongs
 * to those preview routes; importing RailShell does not connect runtime stores.
 * The app and cookbook also share this shell through app/(workspace). Their
 * router binding supplies links and active state without changing this primitive.
 * See notes/techniques/a-shell-preview-needs-its-own-document.md.
 */
export {};
