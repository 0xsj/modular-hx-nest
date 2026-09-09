import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import {
  AlertDialog, AlertDialogContent, Dialog, DialogClose, DialogContent, DialogTrigger,
  Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger,
  Popover, PopoverContent, PopoverTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
} from "~/components/overlays";
import { X } from "~/components/utility";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

import alertDialogSrc from "~/components/overlays/alert-dialog/alert-dialog.tsx?raw";
import dialogSrc from "~/components/overlays/dialog/dialog.tsx?raw";
import menuSrc from "~/components/overlays/menu/menu.tsx?raw";
import popoverSrc from "~/components/overlays/popover/popover.tsx?raw";
import tooltipSrc from "~/components/overlays/tooltip/tooltip.tsx?raw";

const src = {
  dialog: [source("overlays/dialog/dialog.tsx", dialogSrc)],
  alertDialog: [source("overlays/alert-dialog/alert-dialog.tsx", alertDialogSrc)],
  popover: [source("overlays/popover/popover.tsx", popoverSrc)],
  tooltip: [source("overlays/tooltip/tooltip.tsx", tooltipSrc)],
  menu: [source("overlays/menu/menu.tsx", menuSrc)],
} satisfies Record<string, readonly Source[]>;

export function OverlaysSection() {
  return (
    <Section
      id="overlays"
      title="Overlays"
      blurb="Five surfaces that look alike and are not. This is the group where the behaviour IS the component — focus trapped, Escape closes, focus restored, the page behind inert — and none of that is visible in a screenshot, which is why it is also the group that gets interaction tests."
    >
      <Case title="Dialog" note="modal · named · restores focus" sources={src.dialog}>
        <Row label="open it">
          <Dialog>
            <DialogTrigger asChild={(p) => <Button {...p()}>Edit site</Button>} />
            <DialogContent
              title="Edit site"
              description="Changes apply at the next cycle."
              footer={
                <>
                  <DialogClose asChild={(p) => <Button intent="ghost" {...p()}>Cancel</Button>} />
                  <DialogClose asChild={(p) => <Button intent="primary" {...p()}>Save</Button>} />
                </>
              }
            >
              <p>Tab around: focus cannot leave. Press Escape: it closes and focus goes back to the button you came from.</p>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild={(p) => <Button intent="ghost" {...p()}>Hidden title</Button>} />
            <DialogContent title="Filters" titleHidden>
              <p>No visible heading — and it is still announced as "Filters".</p>
            </DialogContent>
          </Dialog>
        </Row>

        <p class={s.caseNote}>
          <code>title</code> is <strong>required</strong>. A dialog with no accessible name is
          announced as "dialog" and nothing else — a reader is told they have been moved
          somewhere and not told where. It is invisible on screen, because the heading is
          usually right there in the markup, just not <em>wired</em>:{" "}
          <code>aria-labelledby</code> comes from the library's Title part, and a hand-rolled{" "}
          <code>h2</code> is not one. <code>titleHidden</code> covers the redundant case —
          hidden is not absent.
        </p>
        <p class={s.caseNote}>
          <code>modal</code> is one prop that decides four behaviours: it traps focus, locks
          scroll, and closes on an outside press. Turn it off and none of those hold — at which
          point you wanted a <code>Popover</code>. <code>closeOnEscape</code> and{" "}
          <code>restoreFocus</code> stay true regardless, and neither should be disabled: focus
          that is not restored lands on <code>body</code>, from which the next Tab starts at
          the top of the document.
        </p>
        <p class={s.caseNote}>
          Note the footer buttons use <code>asChild</code>. <code>DialogClose</code> is{" "}
          <em>itself</em> a <code>button</code>, so wrapping one produces a button inside a
          button — invalid HTML, and two elements with the same accessible name.
        </p>
      </Case>

      <Case title="AlertDialog" note="one prop, three behaviours" sources={src.alertDialog}>
        <Row label="destructive">
          <AlertDialog>
            <DialogTrigger asChild={(p) => <Button intent="danger" {...p()}>Delete site</Button>} />
            <AlertDialogContent
              title="Delete this site?"
              description="Every camera and every recording goes with it. This cannot be undone."
              cancel={<DialogClose asChild={(p) => <Button intent="ghost" {...p()}>Keep it</Button>} />}
              confirm={<DialogClose asChild={(p) => <Button intent="danger" {...p()}>Delete</Button>} />}
            >
              <p>148 cameras and 2.1 TB of recordings will be removed.</p>
            </AlertDialogContent>
          </AlertDialog>
        </Row>

        <p class={s.caseNote}>
          Setting <code>role="alertdialog"</code> is not a relabelling — the library derives
          three behaviours from it: outside presses stop dismissing, focus lands on the{" "}
          <strong>close trigger</strong> rather than the first control, and Escape is
          untouched. Try clicking the page behind it: nothing happens.
        </p>
        <p class={s.caseNote}>
          It is a separate export rather than a documented prop because a caller who has to
          remember the prop will forget it, and the failure is a destructive confirmation that
          closes on a stray click — losing the question and leaving you unsure whether it
          happened.
        </p>
        <p class={s.caseNote}>
          Focus lands on the cancel action, so <code>cancel</code> and <code>confirm</code> are
          separate props rather than one <code>footer</code>: they are not interchangeable, and
          a shape that lets them be swapped is a shape where Enter deletes the account. There
          is no ✕ — a cross is an answer nobody chose — but Escape stays, because it is a
          deliberate act unlike a stray click.
        </p>
      </Case>

      <Case title="Popover" note="not a tooltip, not a dialog" sources={src.popover}>
        <Row label="interactive">
          <Popover>
            <PopoverTrigger asChild={(p) => <Button intent="secondary" {...p()}>Filters</Button>} />
            <PopoverContent title="Filter cameras" description="Applies to this site only.">
              <Flex direction="column" gap={2}>
                <Button size="sm" intent="ghost">Offline only</Button>
                <Button size="sm" intent="ghost">Needs firmware</Button>
              </Flex>
            </PopoverContent>
          </Popover>
        </Row>

        <p class={s.caseNote}>
          The difference from a tooltip is <strong>reachability</strong>: a popover's content
          can be tabbed into and pressed, which a tooltip's cannot, because a tooltip
          disappears on the way there. The difference from a dialog is{" "}
          <strong>interruption</strong>: this does not trap focus or lock scroll, so the page
          behind stays usable — right for a filter panel, wrong for anything that must be
          finished first.
        </p>
      </Case>

      <Case title="Tooltip" note="a hint, never a name" sources={src.tooltip}>
        <Row label="hint">
          <Tooltip>
            <TooltipTrigger asChild={(p) => (
              <Button size="icon" aria-label="Dismiss" {...p()}><X size={14} aria-hidden="true" /></Button>
            )} />
            <TooltipContent>Dismiss this notice · Esc</TooltipContent>
          </Tooltip>
        </Row>

        <p class={s.caseNote}>
          The button above carries its own <code>aria-label</code>, and would still need one
          if the tooltip were removed. <strong>A tooltip cannot be a label:</strong> there is
          no hover on touch, a reader takes the name from the control, and a keyboard user
          only sees the tip once they are already there. The tip earns its place by saying
          something the name does not — here, the shortcut.
        </p>
        <p class={s.caseNote}>
          Never put anything interactive inside one. It closes on blur and on pointer-leave,
          so a link in a tooltip is a link nobody can click — tab toward it and the tip is gone
          before focus arrives. That is what a <code>Popover</code> is for. Measured: it opens
          on <em>keyboard</em> focus rather than on any focus, so clicking a button does not
          pop a tip over the thing you just pressed.
        </p>
      </Case>

      <Case title="Menu" note="actions, not values" sources={src.menu}>
        <Row label="menu">
          <Menu>
            <MenuTrigger asChild={(p) => <Button intent="secondary" {...p()}>Actions</Button>} />
            <MenuContent>
              <MenuGroup label="This site">
                <MenuItem value="duplicate">Duplicate</MenuItem>
                <MenuItem value="export">Export recordings</MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuItem value="archive">Archive</MenuItem>
              <MenuItem value="delete" disabled>Delete (needs owner)</MenuItem>
            </MenuContent>
          </Menu>
        </Row>

        <p class={s.caseNote}>
          A menu <strong>performs</strong>; a select <strong>holds a value</strong>. They look
          almost identical and are announced differently — <code>menu</code>/
          <code>menuitem</code> against <code>combobox</code>/<code>option</code> — and the
          roles are a promise about what pressing one does. The test:{" "}
          <strong>is there something to submit afterwards?</strong>
        </p>
        <p class={s.caseNote}>
          Arrow through it with the keyboard. DOM focus stays on the menu while a{" "}
          <em>virtual</em> focus moves between items, marked with{" "}
          <code>data-highlighted</code> — which is why the stylesheet keys off that attribute
          and not <code>:hover</code>. Styling hover alone leaves a keyboard user with a menu
          that responds to the arrows and shows nothing. Typeahead works too: press "e".
        </p>
      </Case>
    </Section>
  );
}
