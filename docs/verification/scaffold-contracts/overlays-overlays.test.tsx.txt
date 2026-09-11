import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "~/components/forms";
import {
  AlertDialog, AlertDialogContent, Dialog, DialogClose, DialogContent, DialogTrigger,
  Menu, MenuContent, MenuItem, MenuTrigger,
  Popover, PopoverContent, PopoverTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
} from "./index";

afterEach(cleanup);

/* These are INTERACTION tests, and this is the group that earns them: what an
 * overlay promises happens over time and across elements — focus trapped,
 * Escape closes, focus restored — and none of it is visible in one render.
 *
 * The library's callbacks settle on a microtask, so every assertion after an
 * event waits rather than reading the state from before it.
 *
 * Queries come from `screen`, not from `render`'s return: every overlay here
 * is PORTALLED, so its content lands in `document.body` and not in the
 * container `render` scopes its queries to. A container-scoped query reports
 * "unable to find role dialog" about a dialog that is open and correct.
 *
 * And opening takes TWO turns, measured:
 *
 *     sync        hidden=true   data-state=closed
 *     microtask   hidden=true   data-state=open
 *     macrotask   hidden=false  data-state=open
 *
 * The state flips on a microtask and the `hidden` attribute clears on a
 * macrotask. `getByRole` correctly ignores a `hidden` element, so a check that
 * waits only for the microtask reports the overlay missing while it is open —
 * and `waitFor(() => {})` with an empty callback waits for nothing at all. */
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("Dialog", () => {
  const mount = () =>
    render(() => (
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Delete site" description="This cannot be undone.">
          <button type="button">inside</button>
        </DialogContent>
      </Dialog>
    ));

  it("is closed until it is opened", () => {
    mount();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has an accessible name, which is the defect this API prevents", async () => {
    mount();
    fireEvent.click(screen.getByText("Open"));
    await settled();
    expect(
      screen.getByRole("dialog", { name: "Delete site" }),
      "a nameless dialog says a user has been moved, and not where",
    ).toBeTruthy();
  });

  it("keeps the name when the title is hidden from the screen", async () => {
    render(() => (
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Filters" titleHidden>body</DialogContent>
      </Dialog>
    ));
    fireEvent.click(screen.getByText("Open"));
    await settled();
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
  });

  it("closes on Escape, the one dismissal a keyboard user can rely on", async () => {
    mount();
    fireEvent.click(screen.getByText("Open"));
    await settled();
    expect(screen.queryByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await settled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("returns focus to the trigger it was opened from", async () => {
    mount();
    const trigger = screen.getByText("Open");
    trigger.focus();
    fireEvent.click(trigger);
    await settled();
    expect(screen.queryByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(
        document.activeElement,
        "focus left on body starts the next Tab at the top of the document",
      ).toBe(trigger),
    );
  });

  it("marks the page behind as inert while it is open", async () => {
    mount();
    fireEvent.click(screen.getByText("Open"));
    await settled();
    /* `modal` is what makes the page behind unreachable. The library hides it
     * from the accessibility tree rather than only drawing a scrim. */
    await waitFor(() => {
      const hidden = document.querySelectorAll("[aria-hidden='true'], [data-aria-hidden]");
      expect(hidden.length).toBeGreaterThan(0);
    });
  });
});

describe("AlertDialog", () => {
  const mount = (onConfirm = vi.fn()) =>
    render(() => (
      <AlertDialog>
        <DialogTrigger>Remove site</DialogTrigger>
        <AlertDialogContent
          title="Delete this site?"
          description="Every camera and every recording goes with it."
          /* asChild, NOT a Button nested inside: the close trigger is itself
             a <button>, and wrapping one produces a button inside a button —
             invalid HTML, and two elements with the same accessible name. */
          cancel={
            <DialogClose asChild={(p) => <Button intent="ghost" {...p()}>Keep it</Button>} />
          }
          confirm={<Button intent="danger" onClick={onConfirm}>Delete</Button>}
        >
          148 cameras will be removed.
        </AlertDialogContent>
      </AlertDialog>
    ));

  it("is an alertdialog, which is a different announcement", async () => {
    mount();
    fireEvent.click(screen.getByText("Remove site"));
    await settled();
    expect(screen.getByRole("alertdialog", { name: "Delete this site?" })).toBeTruthy();
  });

  it("has no ✕, because a cross is an answer nobody chose", async () => {
    mount();
    fireEvent.click(screen.getByText("Remove site"));
    await settled();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  /* The behaviour the whole component exists for. */
  it("does not close on a press outside", async () => {
    mount();
    fireEvent.click(screen.getByText("Remove site"));
    await settled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeTruthy());

    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    await settled();
    expect(
      screen.queryByRole("alertdialog"),
      "a stray click must not answer a destructive question",
    ).toBeTruthy();
  });

  it("still closes on Escape, which is a deliberate act", async () => {
    mount();
    fireEvent.click(screen.getByText("Remove site"));
    await settled();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("offers both answers, and does not act until one is chosen", async () => {
    const onConfirm = vi.fn();
    mount(onConfirm);
    fireEvent.click(screen.getByText("Remove site"));
    await settled();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("Popover", () => {
  const mount = () =>
    render(() => (
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent title="Filter cameras">
          <button type="button">Apply</button>
        </PopoverContent>
      </Popover>
    ));

  it("is named, so a reader is told what opened", async () => {
    mount();
    fireEvent.click(screen.getByText("Filters"));
    await settled();
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Filter cameras" })).toBeTruthy());
  });

  it("holds content that can actually be reached, unlike a tooltip", async () => {
    mount();
    fireEvent.click(screen.getByText("Filters"));
    await settled();
    await waitFor(() => {
      const apply = screen.getByRole("button", { name: "Apply" });
      apply.focus();
      expect(document.activeElement).toBe(apply);
    });
  });
});

describe("Tooltip", () => {
  it("is not the control's name — the control still needs one", async () => {
    render(() => (
      <Tooltip openDelay={0}>
        <TooltipTrigger aria-label="Dismiss">✕</TooltipTrigger>
        <TooltipContent>Dismiss this notice (Esc)</TooltipContent>
      </Tooltip>
    ));
    expect(
      screen.getByRole("button", { name: "Dismiss" }),
      "an icon-only control with only a tooltip is an unlabelled control",
    ).toBeTruthy();
  });

  /* Measured: the tip opens on KEYBOARD focus, and a plain `focus` event does
   * not do it. That is deliberate in the library — it tracks input modality,
   * so clicking a button does not pop a tip over the thing you just clicked.
   * Establishing modality with a Tab keydown is what a real Tab does. */
  it("appears on keyboard focus, so it is reachable without a pointer", async () => {
    render(() => (
      <Tooltip openDelay={0} closeDelay={0}>
        <TooltipTrigger aria-label="Dismiss">✕</TooltipTrigger>
        <TooltipContent>Dismiss this notice (Esc)</TooltipContent>
      </Tooltip>
    ));
    const trigger = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.keyDown(document, { key: "Tab" });
    trigger.focus();
    fireEvent.focus(trigger);
    await settled();
    expect(await screen.findByRole("tooltip")).toBeTruthy();
  });

  it("does not appear merely because something was clicked", async () => {
    render(() => (
      <Tooltip openDelay={0} closeDelay={0}>
        <TooltipTrigger aria-label="Dismiss">✕</TooltipTrigger>
        <TooltipContent>Dismiss this notice (Esc)</TooltipContent>
      </Tooltip>
    ));
    const trigger = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.pointerDown(trigger);
    trigger.focus();
    fireEvent.focus(trigger);
    await settled();
    expect(
      screen.queryAllByRole("tooltip"),
      "a tip over the control you just pressed is in the way, not helpful",
    ).toHaveLength(0);
  });
});

describe("Menu", () => {
  const mount = (onSelect = vi.fn()) =>
    render(() => (
      <Menu onSelect={onSelect}>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem value="duplicate">Duplicate</MenuItem>
          <MenuItem value="export">Export</MenuItem>
        </MenuContent>
      </Menu>
    ));

  it("is a menu of menuitems, not a listbox of options", async () => {
    mount();
    fireEvent.click(screen.getByText("Actions"));
    await settled();
    await waitFor(() => expect(screen.getByRole("menu")).toBeTruthy());
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.queryByRole("listbox"), "a menu that holds a value is a select").toBeNull();
  });

  /* Measured: a bare `click` on an item does nothing. The item has to be
   * HIGHLIGHTED first, which a real pointer does by moving over it and a real
   * keyboard does by arrowing to it. A test that only clicks reports the menu
   * broken; a component that only styles `:hover` leaves the keyboard user
   * with no idea which item that is. */
  it("performs on a pointer that moved over the item first", async () => {
    const onSelect = vi.fn();
    mount(onSelect);
    fireEvent.click(screen.getByText("Actions"));
    await settled();
    const items = await screen.findAllByRole("menuitem");
    fireEvent.pointerMove(items[0]!, { pointerType: "mouse", clientX: 5, clientY: 5 });
    await settled();
    expect(items[0]!.hasAttribute("data-highlighted"), "the highlight is virtual focus").toBe(true);
    fireEvent.click(items[0]!);
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
  });

  it("performs from the keyboard, with the arrows moving a virtual focus", async () => {
    const onSelect = vi.fn();
    mount(onSelect);
    fireEvent.click(screen.getByText("Actions"));
    await settled();
    const items = await screen.findAllByRole("menuitem");
    const content = document.querySelector("[data-scope=menu][data-part=content]") as HTMLElement;
    fireEvent.keyDown(content, { key: "ArrowDown" });
    await settled();
    expect(
      items[0]!.hasAttribute("data-highlighted"),
      "styling :hover alone leaves a keyboard user with no idea where they are",
    ).toBe(true);
    fireEvent.keyDown(content, { key: "Enter" });
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
  });
});
