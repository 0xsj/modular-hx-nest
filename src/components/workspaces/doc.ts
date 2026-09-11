/**
 * Workspaces — controlled interactive surfaces, independent of persistence.
 *
 * CONTRACT (written before implementation)
 * Canvas takes nodes with stable IDs, positions, and caller-rendered content,
 * edges, a selection, and callbacks. It supplies pan/zoom, fit, node dragging,
 * keyboard movement/selection, and an explicit empty state. It reports controlled
 * position changes; save boundaries, data layout, and authored pins belong to callers.
 * No product graph, connection creation, or node inspector schema is built in.
 *
 * DashboardGrid takes stable widget IDs, titles, content, and layout in grid
 * units. View mode has no editing handles. Edit mode permits pointer drag/resize
 * and equivalent labelled move/size menu actions, with bounded geometry. Occupied
 * destinations are refused. Removal and
 * adding widgets belong to the caller. Narrow screens stack the same widgets;
 * they do not overwrite the saved desktop arrangement. Empty content is explicit.
 * Layout commits describe an arrangement, never rendered nodes or fetched data.
 *
 * MECHANICS
 * The Solid port uses owned pointer and keyboard bindings with portable geometry.
 * Canvas and dashboard content are lazy render callbacks, evaluated inside the
 * mounted node/widget owner. Data inspection never constructs unused JSX during
 * SSR. SVG edges use graph coordinates; the viewport transform moves nodes and
 * edges together. Layout changes emit plain data; browser storage belongs to the
 * cookbook binding. Pointer capture, bounded resizing and keyboard move/size
 * actions are verified in the browser. These mechanics differ from the Next
 * engines while preserving the public interaction and persistence contract.
 *
 * VERIFICATION
 * Ordinary tests and browser interaction checks, with implementation access.
 * No blind spec-test run or assistive-technology certification is claimed.
 */
export {};
