import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@solidjs/testing-library";
import { createSignal, type Setter } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { unavailable, type Presence as PresenceValue } from "~/lib/kernel";
import { GraphFrame, LineChart } from "./charts";
import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Presence,
} from "./display";
import { Checkbox, Input, Radio, RadioGroup, Switch, Toggle } from "./forms";
import { Box, Flex } from "./layout";
import { Pagination, Tab, TabPanel, Tabs, TabsList } from "./navigation";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./overlays";
import { SelectionCard } from "./patterns";
import { RailShell, SidebarNav } from "./shells";
import { Heading, Text } from "./typography";

// Implementation-visible native binding regressions. These do not replace or
// claim the independent oracle of the archived scaffold/spec-test contracts.
afterEach(cleanup);

describe("Solid composition and owned slots", () => {
  it("evaluates a header action once and keeps its input and focus during updates", () => {
    let creations = 0;
    let set!: Setter<string>;
    const Action = () => {
      creations++;
      return <Input aria-label="Action input" />;
    };
    const view = render(() => {
      const [label, update] = createSignal("First");
      set = update;
      return (
        <Card>
          <CardHeader actions={<Action />}>
            <CardTitle level={2}>{label()}</CardTitle>
          </CardHeader>
          <CardBody>Body</CardBody>
        </Card>
      );
    });
    const input = view.getByRole("textbox") as HTMLInputElement;
    input.focus();
    input.value = "draft";
    set("Second");
    expect(creations).toBe(1);
    expect(view.getByRole("textbox")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("draft");
    expect(view.getByRole("heading").textContent).toBe("Second");
  });
  it("updates semantic heading level and text tag independently of appearance", () => {
    let update!: Setter<2 | 3>;
    const view = render(() => {
      const [level, set] = createSignal<2 | 3>(2);
      update = set;
      return (
        <>
          <Heading level={level()} size="sm">
            Title
          </Heading>
          <Text as="span">Detail</Text>
        </>
      );
    });
    expect(view.getByRole("heading").tagName).toBe("H2");
    update(3);
    expect(view.getByRole("heading").tagName).toBe("H3");
    expect(view.getByText("Detail").tagName).toBe("SPAN");
  });
  it("changes layout tokens without replacing the child", () => {
    let update!: Setter<2 | 5>;
    const view = render(() => {
      const [space, set] = createSignal<2 | 5>(2);
      update = set;
      return (
        <Box p={space()} data-testid="box">
          <Flex gap={space()}>
            <Input aria-label="Draft" />
          </Flex>
        </Box>
      );
    });
    const input = view.getByRole("textbox"),
      before = view.getByTestId("box").getAttribute("style");
    update(5);
    expect(view.getByTestId("box").getAttribute("style")).not.toBe(before);
    expect(view.getByRole("textbox")).toBe(input);
  });
  it("preserves found zero and distinguishes empty from unmeasured after state changes", () => {
    let update!: Setter<PresenceValue<number>>;
    const view = render(() => {
      const [state, set] = createSignal<PresenceValue<number>>({
        state: "found",
        value: 0,
      });
      update = set;
      return (
        <Presence of={state()}>{(value) => <span>{value}</span>}</Presence>
      );
    });
    expect(view.container.textContent).toBe("0");
    update({ state: "empty" });
    expect(view.container.textContent).toContain("none");
    update({ state: "unmeasured", failure: unavailable("Not checked") });
    expect(view.getByTitle(/never checked/)).toBeTruthy();
    expect(view.container.textContent).not.toContain("none");
  });
  it("exposes the full avatar name without repeating initials to a reader", () => {
    const view = render(() => <Avatar name="Ada Lovelace" />);
    expect(view.getByText("AL").getAttribute("aria-hidden")).toBe("true");
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
  });
});

describe("native choices and controlled state", () => {
  it("exposes switch semantics, emits one change, and serializes only when checked", async () => {
    const change = vi.fn();
    const view = render(() => {
      const [checked, set] = createSignal(false);
      return (
        <form>
          <Switch
            name="digest"
            value="weekly"
            aria-label="Digest"
            checked={checked()}
            onCheckedChange={(v) => {
              change(v);
              set(v);
            }}
          />
        </form>
      );
    });
    const control = view.getByRole("switch");
    expect((control as HTMLInputElement).checked).toBe(false);
    fireEvent.click(control);
    await waitFor(() =>
      expect((control as HTMLInputElement).checked).toBe(true),
    );
    expect(change).toHaveBeenCalledExactlyOnceWith(true);
    expect(
      new FormData(view.container.querySelector("form")!).get("digest"),
    ).toBe("weekly");
  });
  it("sets the native checkbox mixed state and keeps the name", async () => {
    const view = render(() => (
      <Checkbox aria-label="All rows" checked="indeterminate" />
    ));
    await waitFor(() =>
      expect(
        (view.getByRole("checkbox") as HTMLInputElement).indeterminate,
      ).toBe(true),
    );
  });
  it("reacts to radio selection and emits public string values", async () => {
    const change = vi.fn();
    const view = render(() => (
      <RadioGroup defaultValue="a" onValueChange={change}>
        <Radio value="a" aria-label="A" />
        <Radio value="b" aria-label="B" />
      </RadioGroup>
    ));
    fireEvent.click(view.getByRole("radio", { name: "B" }));
    await waitFor(() => expect(change).toHaveBeenCalledExactlyOnceWith("b"));
  });
  it("updates selection card descriptions and disabled control props in place", () => {
    let update!: Setter<boolean>;
    const view = render(() => {
      const [disabled, set] = createSignal(false);
      update = set;
      return (
        <SelectionCard
          mode="multiple"
          label="Team"
          value="team"
          description={disabled() ? "Unavailable" : "Available"}
          disabled={disabled()}
        />
      );
    });
    const control = view.getByRole("checkbox") as HTMLInputElement;
    update(true);
    expect(control.disabled).toBe(true);
    expect(view.getByText("Unavailable").id).toBe(
      control.getAttribute("aria-describedby"),
    );
  });
  it("reports controlled toggle state without inventing a local choice", () => {
    const change = vi.fn();
    const view = render(() => (
      <Toggle pressed={false} onPressedChange={change}>
        Bold
      </Toggle>
    ));
    fireEvent.click(view.getByRole("button"));
    expect(change).toHaveBeenCalledExactlyOnceWith(true);
    expect(view.getByRole("button").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("navigation and overlays", () => {
  it("renders one main and reports the actual rail sidebar state after each toggle", () => {
    const change = vi.fn();
    const view = render(() => (
      <RailShell
        rail={<nav aria-label="Areas" />}
        sidebar={<nav aria-label="Pages" />}
        onSidebarOpenChange={change}
      >
        <h1>Home</h1>
      </RailShell>
    ));
    expect(view.getAllByRole("main")).toHaveLength(1);
    fireEvent.click(
      view.getByRole("button", { name: "Hide section navigation" }),
    );
    expect(change).toHaveBeenLastCalledWith(false);
    fireEvent.click(
      view.getByRole("button", { name: "Show section navigation" }),
    );
    expect(change).toHaveBeenLastCalledWith(true);
  });
  it("matches whole path segments and honors exact navigation entries", () => {
    let update!: Setter<string>;
    const view = render(() => {
      const [current, set] = createSignal("/app/items");
      update = set;
      return (
        <SidebarNav
          current={current()}
          groups={[
            {
              items: [
                { href: "/app", label: "App" },
                { href: "/app/items", label: "Items", exact: true },
              ],
            },
          ]}
        />
      );
    });
    expect(
      view.getByRole("link", { name: "App" }).getAttribute("aria-current"),
    ).toBe("page");
    update("/apples");
    expect(
      view.getByRole("link", { name: "App" }).hasAttribute("aria-current"),
    ).toBe(false);
  });
  it("updates pagination visibility and calls the next-page contract", () => {
    let update!: Setter<number>;
    const change = vi.fn();
    const view = render(() => {
      const [total, set] = createSignal(1);
      update = set;
      return <Pagination totalPages={total()} page={1} onPageChange={change} />;
    });
    expect(view.queryByRole("navigation")).toBeNull();
    update(3);
    fireEvent.click(view.getByRole("button", { name: "Next page" }));
    expect(change).toHaveBeenCalledWith(2);
    expect(
      (view.getByRole("button", { name: "Previous page" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
  it("links tab names and selected panels through native ARIA state", async () => {
    const view = render(() => (
      <Tabs defaultValue="a">
        <TabsList aria-label="Views">
          <Tab value="a">First</Tab>
          <Tab value="b">Second</Tab>
        </TabsList>
        <TabPanel value="a">Alpha</TabPanel>
        <TabPanel value="b">Beta</TabPanel>
      </Tabs>
    ));
    fireEvent.click(view.getByRole("tab", { name: "Second" }));
    await waitFor(() =>
      expect(
        view.getByRole("tab", { name: "Second" }).getAttribute("aria-selected"),
      ).toBe("true"),
    );
    await waitFor(() =>
      expect(view.getByRole("tabpanel").textContent).toBe("Beta"),
    );
  });
  it("keeps a hidden visual dialog title as its accessible name and dismisses", async () => {
    const view = render(() => (
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Settings" hideTitle>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>
    ));
    fireEvent.click(view.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("reactive chart geometry", () => {
  it("accepts data after an initially empty line chart and rescales it", () => {
    let update!: Setter<number>;
    const view = render(() => {
      const [value, set] = createSignal(0);
      update = set;
      return (
        <LineChart
          label="Series"
          data={value() ? [{ label: "Now", values: { a: value() } }] : []}
          series={[{ key: "a", label: "A" }]}
        />
      );
    });
    expect(view.queryByRole("img")).toBeNull();
    update(10);
    expect(view.getByRole("img")).toBeTruthy();
    const before = view.container.querySelector("path")!.getAttribute("d");
    update(-10);
    expect(view.container.querySelector("path")!.getAttribute("d")).not.toBe(
      before,
    );
  });
  it("moves existing graph nodes when the layout dimensions change", () => {
    let update!: Setter<number>;
    const nodes = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ];
    const view = render(() => {
      const [width, set] = createSignal(200);
      update = set;
      return (
        <GraphFrame
          nodes={nodes}
          edges={[{ from: "a", to: "b" }]}
          width={width()}
          height={200}
          layout="circular"
          onSelect={() => {}}
        />
      );
    });
    const node = view.getByRole("button", { name: "A" }),
      before = node.getAttribute("transform");
    update(500);
    expect(view.getByRole("button", { name: "A" })).toBe(node);
    expect(node.getAttribute("transform")).not.toBe(before);
  });
});

describe("native reset ordering", () => {
  it("restores a controlled radio and checkbox after the platform resets the form", async () => {
    const view = render(() => {
      const [value, setValue] = createSignal("board"),
        [checked, setChecked] = createSignal(false);
      return (
        <form
          onReset={() => {
            setValue("board");
            setChecked(false);
          }}
        >
          <RadioGroup name="layout" value={value()} onValueChange={setValue}>
            <Radio id="board-field" value="board" aria-label="Board" />
            <Radio id="list-field" value="list" aria-label="List" />
          </RadioGroup>
          <Checkbox
            checked={checked()}
            onCheckedChange={(v) => setChecked(v === true)}
            aria-label="Reports"
          />
        </form>
      );
    });
    fireEvent.click(view.getByRole("radio", { name: "List" }));
    fireEvent.click(view.getByRole("checkbox"));
    await waitFor(() =>
      expect(
        (view.getByRole("radio", { name: "List" }) as HTMLInputElement).checked,
      ).toBe(true),
    );
    view.container.querySelector("form")!.reset();
    await waitFor(() => {
      expect(
        (view.getByRole("radio", { name: "Board" }) as HTMLInputElement)
          .checked,
      ).toBe(true);
      expect((view.getByRole("checkbox") as HTMLInputElement).checked).toBe(
        false,
      );
    });
  });
});
