import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { DENSITIES, THEMES, useDensity, useTheme } from "~/lib/runtime";
import { DensityToggle, Mark, PRODUCT_NAME, Segmented, ThemeToggle } from "./index";

afterEach(cleanup);

/* The stores are module-level and outlive a test, so a case that changes the
 * theme leaks into every case after it. Without this reset, "defaults to
 * system" passes only because it happens to run before the case that selects
 * Dark — an order dependency, not an assertion. */
afterEach(() => {
  const r = render(() => <>{(useTheme().set("system"), useDensity().set("comfortable"), null)}</>);
  r.unmount();
});

const at = (path: string, ui: () => JSX.Element) => {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true });
  return render(() => (
    <MemoryRouter history={history}>
      <Route path="*" component={() => <>{ui()}</>} />
    </MemoryRouter>
  ));
};

describe("Segmented", () => {
  const mount = (value = "a") =>
    render(() => (
      <Segmented
        label="Example"
        value={value}
        onChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />
    ));

  /* Three toggle buttons look identical and say something different: each is
   * announced as its own two-state control, with nothing stating they are
   * alternatives or how many there are. */
  it("is a named radio group, not a row of toggle buttons", () => {
    const { getByRole, getAllByRole, queryAllByRole } = mount();
    expect(getByRole("radiogroup", { name: "Example" })).toBeTruthy();
    expect(getAllByRole("radio")).toHaveLength(2);
    expect(queryAllByRole("button")).toHaveLength(0);
  });

  it("marks exactly one as chosen", () => {
    const { getAllByRole } = mount();
    const checked = getAllByRole("radio").filter(
      (r) => (r as HTMLInputElement).checked,
    );
    expect(checked).toHaveLength(1);
  });

  it("keeps the name when the label is hidden from the screen", () => {
    const { getByRole } = render(() => (
      <Segmented
        label="Example" labelHidden value="a" onChange={() => {}}
        options={[{ value: "a", label: "Alpha" }]}
      />
    ));
    expect(getByRole("radiogroup", { name: "Example" })).toBeTruthy();
  });

  it("reports the value, not the event", async () => {
    const seen: string[] = [];
    render(() => (
      <Segmented
        label="Example" value="a" onChange={(v) => seen.push(v)}
        options={[{ value: "a", label: "Alpha" }, { value: "b", label: "Bravo" }]}
      />
    ));
    fireEvent.click(screen.getByText("Bravo"));
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(["b"]);
  });
});

describe("ThemeToggle", () => {
  /* A two-state toggle silently converts "follow the platform" into whatever
   * was showing when it was pressed, with no way back. */
  it("offers all three states, including system", () => {
    const { getAllByRole, getByRole } = render(() => <ThemeToggle />);
    expect(getAllByRole("radio")).toHaveLength(THEMES.length);
    expect(getAllByRole("radio")).toHaveLength(3);
    expect(getByRole("radiogroup", { name: "Theme" })).toBeTruthy();
    expect(screen.getByText("System")).toBeTruthy();
  });

  it("defaults to system", () => {
    render(() => <ThemeToggle />);
    const chosen = screen.getAllByRole("radio").find((r) => (r as HTMLInputElement).checked);
    expect(chosen!.closest("label")!.textContent).toContain("System");
  });

  /* Neither holds the answer, so they cannot disagree. */
  it("two of them stay in step, because neither owns the state", async () => {
    render(() => (<><ThemeToggle /><ThemeToggle /></>));
    const groups = screen.getAllByRole("radiogroup");
    expect(groups).toHaveLength(2);
    fireEvent.click(screen.getAllByText("Dark")[0]!);
    await new Promise((r) => setTimeout(r, 0));
    const checkedLabels = screen
      .getAllByRole("radio")
      .filter((r) => (r as HTMLInputElement).checked)
      .map((r) => r.closest("label")!.textContent);
    expect(checkedLabels).toEqual(["Dark", "Dark"]);
  });
});

describe("DensityToggle", () => {
  it("offers the density options and names the group", () => {
    const { getAllByRole, getByRole } = render(() => <DensityToggle />);
    expect(getAllByRole("radio")).toHaveLength(DENSITIES.length);
    expect(getByRole("radiogroup", { name: "Density" })).toBeTruthy();
  });

  /* The OS has no opinion about how tight a table should be, so two is the
   * honest count — a third to match the theme control would be symmetry for
   * its own sake. */
  it("has no system option, because there is no platform preference", () => {
    render(() => <DensityToggle />);
    expect(screen.queryByText("System")).toBeNull();
  });
});

describe("Mark", () => {
  it("is not a link unless it was given somewhere to go", () => {
    const { queryByRole, container } = at("/x", () => <Mark />);
    expect(queryByRole("link")).toBeNull();
    expect(container.textContent).toBe(PRODUCT_NAME);
  });

  /* A link announced as "Flover" is a link to a word. The convention that a
   * logo goes home is learned from POSITION, which a reader does not have. */
  it("says where it goes when it is a link", () => {
    const { getByRole } = at("/x", () => <Mark href="/" />);
    expect(getByRole("link", { name: `${PRODUCT_NAME}, home` })).toBeTruthy();
  });

  it("hides the glyph, because the word is the name", () => {
    const { container } = at("/x", () => <Mark />);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
    expect(container.textContent, "and it contributes no text").toBe(PRODUCT_NAME);
  });

  it("emits no global router classes", () => {
    const { getByRole } = at("/x", () => <Mark href="/" />);
    const classes = [...getByRole("link").classList];
    expect(classes).not.toContain("active");
    expect(classes).not.toContain("inactive");
  });

  it("takes a name, so a product can override the constant", () => {
    const { container } = at("/x", () => <Mark name="Northgate" />);
    expect(container.textContent).toBe("Northgate");
  });
});

/* Runs last, after the case that selects Dark. It passes only because the
   afterEach above puts the shared store back — remove that hook and this
   fails, which is the proof the hook is load-bearing rather than decoration. */
describe("the shared store is reset between cases", () => {
  it("is back to system by the end of the file", () => {
    render(() => <ThemeToggle />);
    const chosen = screen.getAllByRole("radio").find((r) => (r as HTMLInputElement).checked);
    expect(chosen!.closest("label")!.textContent).toContain("System");
  });
});
