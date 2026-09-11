import { A as Link } from "@solidjs/router";
import { Case, Section } from "../_components/section";
import { readSources } from "../_lib/source";
import { CanvasDemo, GridDemo } from "./workspace-demo";
export function WorkspacesSection() {
  return (
    <Section
      id="workspaces"
      title="Interactive workspaces"
      blurb="Controlled canvas and dashboard surfaces. Callers supply content, selection, arrangement, and persistence."
    >
      <Case
        title="Editable dashboard"
        note="drag and resize on wide screens; arrange menus provide keyboard actions"
        sources={readSources([
          "workspaces/dashboard-grid/dashboard-grid.tsx",
          "workspaces/doc.ts",
        ])}
      >
        <GridDemo />
      </Case>
      <Case
        title="Read-only dashboard"
        note="the same composition without editing affordances"
      >
        <GridDemo readOnly />
      </Case>
      <Case
        title="Empty dashboard"
        note="a deliberate state, with caller-supplied recovery content"
      >
        <GridDemo empty />
      </Case>
      <Case
        title="Freeform canvas"
        note="pan, zoom, keyboard selection, and controlled movement"
        sources={readSources(["workspaces/canvas/canvas.tsx"])}
      >
        <CanvasDemo />
      </Case>
      <Case
        title="Locked positions"
        note="navigation and selection remain available"
      >
        <CanvasDemo readOnly />
      </Case>
      <Case title="Empty canvas" note="no invented nodes or connections">
        <CanvasDemo empty />
      </Case>
      <Case
        title="Working recipes"
        note="persistence and application behavior are composed at the route"
      >
        <Link href="/cookbook/editable-dashboard">Saved dashboard layouts</Link>
        <Link href="/cookbook/canvas">Canvas with an inspector</Link>
        <Link href="/cookbook/live-updates">Live-data subscriptions</Link>
      </Case>
    </Section>
  );
}
