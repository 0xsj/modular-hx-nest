import { For } from "solid-js";
import { Button } from "~/components/forms";
import {
  AccessibleIcon,
  Check,
  ChevronDown,
  LoaderCircle,
  Minus,
  Plus,
  Trash2,
  VisuallyHidden,
  X,
} from "~/components/utility";
import { DomReadout } from "../_components/dom-readout";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { PortalCase } from "./portal-case";
const ICONS = [
  {
    name: "Check",
    Icon: Check,
  },
  {
    name: "ChevronDown",
    Icon: ChevronDown,
  },
  {
    name: "LoaderCircle",
    Icon: LoaderCircle,
  },
  {
    name: "Minus",
    Icon: Minus,
  },
  {
    name: "Plus",
    Icon: Plus,
  },
  {
    name: "Trash2",
    Icon: Trash2,
  },
  {
    name: "X",
    Icon: X,
  },
];
export function UtilitySection() {
  return (
    <Section
      id="utility"
      title="Utility"
      blurb="The small mechanisms other components need. Three of the four change what a reader is told rather than what the screen shows — which is invisible to the review that catches everything else, so each case here reads its own DOM back instead of describing it."
    >
      <Case
        title="Icon"
        note="one file of named re-exports — the inventory, not a guess"
      >
        <div class={s.icons}>
          <For each={ICONS}>
            {({ name, Icon }) => (
              <div class={s.iconCell}>
                <Icon size={16} aria-hidden="true" />
                <span class={s.mono}>{name}</span>
              </div>
            )}
          </For>
        </div>
        <p class={s.limits}>
          Seven, and that is the whole set in use. <code>icon.ts</code> is the
          only file permitted to import the icon library, so adding one is a
          visible line in a diff rather than an import buried in a component —
          and since this group landed that is a failing test rather than a
          convention.
        </p>
      </Case>

      <Case
        title="AccessibleIcon"
        note="the rarest of the three ways to name an icon, not the default"
      >
        <Row label="decorative">
          <DomReadout note="The icon repeats what the label already says. aria-hidden, no component, and this is what the design system does in eight places.">
            <Button intent="primary">
              <Trash2 size={14} aria-hidden="true" />
              Delete target
            </Button>
          </DomReadout>
        </Row>
        <Row label="icon-only control">
          <DomReadout note="The name belongs on the CONTROL. Naming the icon as well announces it twice, and that mistake reads as extra care, which is why it survives review.">
            <Button intent="danger" aria-label="Delete target">
              <Trash2 size={14} aria-hidden="true" />
            </Button>
          </DomReadout>
        </Row>
        <Row label="AccessibleIcon">
          <DomReadout note="No labellable ancestor — a status glyph in a cell. The icon is hidden twice over, and the name is a clipped span beside it.">
            <span class={s.iconCell}>
              <AccessibleIcon label="Passing">
                <Check size={16} />
              </AccessibleIcon>
            </span>
          </DomReadout>
        </Row>
        <p class={s.limits}>
          <code>focusable=&quot;false&quot;</code> is not decoration:{" "}
          <code>aria-hidden</code> removes an SVG from the accessibility tree
          and does not remove it from the tab order. It works by{" "}
          <strong>wrapping</strong> the child, so an icon that does not spread
          its props swallows both attributes and ends up announced twice —
          through the component meant to prevent exactly that.
        </p>
      </Case>

      <Case
        title="VisuallyHidden"
        note="text for a reader and not for the screen"
      >
        <Row label="in a sentence">
          <DomReadout note="The screen shows five words; a reader gets nine. The clipped fragment is the difference, and the markup below is where it lives.">
            <span>
              Delete
              <VisuallyHidden>
                {" "}
                this workspace and everything in it
              </VisuallyHidden>
            </span>
          </DomReadout>
        </Row>
        <Row label="asChild">
          <DomReadout note="Hides an element the caller already owns rather than nesting one inside a hidden span. The dialog's hideTitle uses this, so the primitive still sees its own Title element.">
            <VisuallyHidden
              asChild={(forwarded) => <h4 {...forwarded()}>Filters</h4>}
            />
          </DomReadout>
        </Row>
        <p class={s.limits}>
          <code>display: none</code> and the <code>hidden</code> attribute are
          not alternatives — both remove the text from the accessibility tree,
          which is the one thing this must not do. The styles are{" "}
          <strong>inline</strong>, so nothing in the cascade can beat them; the
          cost is that CSS cannot un-hide it, which is why a{" "}
          <strong>skip link is a different component</strong> and is not built
          yet. There was one copy of this CSS in the dialog and another in the
          avatar before this group landed; both are gone.
        </p>
      </Case>

      <Case
        title="Portal"
        note="the DOM parent moves; the logical parent does not"
      >
        <PortalCase />
        <p class={s.limits}>
          Reach for it only to escape an ancestor that clips or contains —{" "}
          <code>overflow: hidden</code>, or a <code>transform</code>, which
          makes that ancestor the containing block for everything fixed inside
          it. Every overlay in this system already portals itself, so this is
          rarely the answer.
        </p>
        <p class={s.limits}>
          The counter is on the clipping box. It keeps incrementing after the
          content leaves, because a delegated Solid event follows the{" "}
          <strong>Solid owner</strong> tree — a handler that is no longer a DOM
          ancestor still fires, and a native listener on the same element stops.
          It also renders <strong>nothing on the server</strong>: no first-paint
          or indexable content may live inside one.
        </p>
      </Case>
    </Section>
  );
}
