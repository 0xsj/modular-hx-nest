/**
 * The workspace contains two destinations sharing the same rail shell.
 *
 * CONTRACT
 * /cookbook is public and lists working examples. Its recipe group and /app
 * require a verified session. /app starts with a minimal Home page; it imports
 * no cookbook implementation. Components retain their separate catalog.
 * The rail selects an area, the contextual sidebar selects an exact page.
 * Both remain available when a protected page fails. Authentication returns to
 * the requested local app/cookbook URL, including its query string.
 *
 * MECHANICS
 * A shared layout owns the frame, optional account display, and query cache.
 * Guards live below that frame, in protected layouts and at the data callers,
 * so a guard failure reaches the workspace boundary while navigation survives.
 * A provider alone performs no authenticated query; guarded recipe pages are
 * the only place their client consumers are mounted.
 * Navigation metadata lives beside this group and is imported by the client
 * binding, keeping icon functions out of server-to-client props. Recipe content
 * stays in cookbook/; only destination metadata is shared with the rail.
 */
export {};
