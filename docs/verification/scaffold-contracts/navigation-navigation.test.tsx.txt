import { MemoryRouter, Route, createMemoryHistory, useLocation } from "@solidjs/router";
import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Breadcrumb, NavLink, Tab, TabList, TabPanel, Tabs } from "./index";

afterEach(cleanup);

/** The router components need a router, and a location to be at.
 *
 *  `createMemoryHistory()` always starts at "/" and takes no initial entry, so
 *  the location has to be SET before rendering — `MemoryRouter` has no prop
 *  for it. Measured: passing `initialEntries` is silently ignored and every
 *  case then asserts about "/", which makes the section-versus-page tests pass
 *  and fail for reasons unrelated to what they are checking. */
const at = (path: string, ui: () => JSX.Element) => {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true });
  return render(() => (
    <MemoryRouter history={history}>
      <Route path="*" component={() => <>{ui()}</>} />
    </MemoryRouter>
  ));
};

/* The harness is the instrument, and it was wrong once already: with the
 * location stuck at "/", the section-versus-page cases below pass and fail for
 * reasons that have nothing to do with what they assert. Pin it first. */
describe("the harness is actually at the path it claims", () => {
  it("puts the router where the case asked", () => {
    const seen: string[] = [];
    const Probe = () => { seen.push(useLocation().pathname); return null; };
    for (const path of ["/sites", "/sites/eu-west", "/settings"]) {
      const r = at(path, () => <Probe />);
      r.unmount();
    }
    expect(seen).toEqual(["/sites", "/sites/eu-west", "/settings"]);
  });
});

describe("NavLink · the section and the page are different claims", () => {
  it("marks the exact page as current", () => {
    const { getByRole } = at("/sites", () => <NavLink href="/sites">Sites</NavLink>);
    expect(getByRole("link", { name: "Sites" }).getAttribute("aria-current")).toBe("page");
  });

  /* The one that matters. On /sites/eu-west the Sites item is the section you
   * are in, and is NOT the page you are on — announcing it as the current page
   * sends somebody looking for a page they are not on. */
  it("does not claim to be the current page from a child route", () => {
    const { getByRole } = at("/sites/eu-west", () => <NavLink href="/sites">Sites</NavLink>);
    const link = getByRole("link", { name: "Sites" });
    expect(
      link.getAttribute("aria-current"),
      "a parent section is not the current page",
    ).toBeNull();
  });

  it("still lights the section it is inside", () => {
    const child = at("/sites/eu-west", () => <NavLink href="/sites">Sites</NavLink>);
    const lit = [...child.getByRole("link").classList];
    child.unmount();
    const elsewhere = at("/settings", () => <NavLink href="/sites">Sites</NavLink>);
    const unlit = [...elsewhere.getByRole("link").classList];
    expect(lit, "the highlight is a prefix match, unlike aria-current").not.toEqual(unlit);
  });

  /* `/` normalises to the empty string, so the prefix test becomes
   * `location.startsWith("/")` — true everywhere. */
  it("a root link is active everywhere unless `end` says otherwise", () => {
    const loose = at("/settings", () => <NavLink href="/">Home</NavLink>);
    const looseLit = [...loose.getByRole("link").classList];
    loose.unmount();

    const exact = at("/settings", () => <NavLink href="/" end>Home</NavLink>);
    const exactLit = [...exact.getByRole("link").classList];
    expect(looseLit, "the root prefix matches every route").not.toEqual(exactLit);

    /* And the announcement is unaffected either way — it was already exact. */
    expect(exact.getByRole("link").getAttribute("aria-current")).toBeNull();
  });

  it("is not current on an unrelated route", () => {
    const { getByRole } = at("/settings", () => <NavLink href="/sites">Sites</NavLink>);
    expect(getByRole("link").getAttribute("aria-current")).toBeNull();
  });

  /* The router's defaults are the global class names "active"/"inactive" —
   * two unscoped names in a codebase that otherwise has none. */
  it("never emits the router's global class names", () => {
    for (const path of ["/sites", "/sites/eu-west", "/elsewhere"]) {
      const r = at(path, () => <NavLink href="/sites">Sites</NavLink>);
      const classes = [...r.getByRole("link").classList];
      expect(classes, `at ${path}`).not.toContain("active");
      expect(classes, `at ${path}`).not.toContain("inactive");
      r.unmount();
    }
  });
});

describe("Breadcrumb", () => {
  const TRAIL = [
    { label: "Home", href: "/" },
    { label: "Sites", href: "/sites" },
    { label: "EU-West" },
  ];

  it("is a named landmark, because a page has several", () => {
    const { getByRole } = at("/sites/eu-west", () => <Breadcrumb items={TRAIL} />);
    expect(getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
  });

  it("is an ordered list, because the position is the depth", () => {
    const { container } = at("/x", () => <Breadcrumb items={TRAIL} />);
    expect(container.querySelector("ol")).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  /* The defect this component's API exists to make unrepresentable — and the
   * case has to supply an href for the LAST step, or it proves nothing. A
   * trail whose final item happens to lack one renders as a span either way,
   * so the guard is never exercised and the test passes on a component that
   * would link the current page. */
  it("does not link the page you are already on, even when given a href for it", () => {
    const withHref = [
      { label: "Home", href: "/" },
      { label: "Sites", href: "/sites" },
      { label: "EU-West", href: "/sites/eu-west" },
    ];
    const { getAllByRole, getByText } = at("/sites/eu-west", () => <Breadcrumb items={withHref} />);
    expect(
      getAllByRole("link"),
      "a link to where you already are is an affordance that does nothing",
    ).toHaveLength(2);
    const current = getByText("EU-West");
    expect(current.tagName).toBe("SPAN");
    expect(current.getAttribute("aria-current")).toBe("page");
  });

  it("also renders a hrefless last step as the current page", () => {
    const { getAllByRole, getByText } = at("/x", () => <Breadcrumb items={TRAIL} />);
    expect(getAllByRole("link")).toHaveLength(2);
    expect(getByText("EU-West").tagName).toBe("SPAN");
  });

  it("marks the last step as the current page", () => {
    const { getByText } = at("/x", () => <Breadcrumb items={TRAIL} />);
    expect(getByText("EU-West").getAttribute("aria-current")).toBe("page");
  });

  it("marks only the last step", () => {
    const { container } = at("/x", () => <Breadcrumb items={TRAIL} />);
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("renders an intermediate step with no href as text, not a dead link", () => {
    const items = [{ label: "Settings", href: "/s" }, { label: "Billing" }, { label: "Invoice" }];
    const { getAllByRole, getByText } = at("/x", () => <Breadcrumb items={items} />);
    expect(getAllByRole("link")).toHaveLength(1);
    expect(getByText("Billing").hasAttribute("aria-current")).toBe(false);
  });

  it("draws the separators without speaking them", () => {
    const { container } = at("/x", () => <Breadcrumb items={TRAIL} />);
    const seps = [...container.querySelectorAll("[aria-hidden='true']")];
    expect(seps, "one fewer than the steps").toHaveLength(2);
    expect(seps.every((s) => s.textContent === "/")).toBe(true);
  });

  /* The two things the router's `A` would do to this component, asserted at
   * the location where they actually fire. Both were found in a rendered page
   * rather than by these tests, which is why the location matters here. */
  it("keeps exactly one current-page claim even when a crumb matches the URL", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Sites", href: "/sites" },
      { label: "EU-West" },
    ];
    const { container } = at("/sites", () => <Breadcrumb items={items} />);
    expect(
      container.querySelectorAll("[aria-current]"),
      "the router marks any href equal to the current URL, and cannot be overridden",
    ).toHaveLength(1);
    expect(container.querySelector("[aria-current]")!.textContent).toBe("EU-West");
  });

  it("emits no global router classes", () => {
    const { container } = at("/sites", () => (
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Sites", href: "/sites" }]} />
    ));
    for (const a of container.querySelectorAll("a")) {
      const classes = [...a.classList];
      expect(classes).not.toContain("active");
      expect(classes).not.toContain("inactive");
    }
  });

  it("handles a single-item trail", () => {
    const { container, getByText } = at("/x", () => <Breadcrumb items={[{ label: "Home" }]} />);
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
    expect(getByText("Home").getAttribute("aria-current")).toBe("page");
  });
});

describe("Tabs", () => {
  const mount = () =>
    render(() => (
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">Overview</Tab>
          <Tab value="b">Streams</Tab>
        </TabList>
        <TabPanel value="a">first</TabPanel>
        <TabPanel value="b">second</TabPanel>
      </Tabs>
    ));

  /* Tabs, not links — the roles are the difference, and they are what a
   * reader announces. A tab that changed the URL would be a link. */
  it("is a tablist of tabs, not a nav of links", () => {
    const { getByRole, getAllByRole, queryAllByRole } = mount();
    expect(getByRole("tablist")).toBeTruthy();
    expect(getAllByRole("tab")).toHaveLength(2);
    expect(queryAllByRole("link"), "a tab that navigates is a link").toHaveLength(0);
  });

  it("selects exactly one at a time, and says which", () => {
    const { getAllByRole } = mount();
    const selected = getAllByRole("tab").filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]!.textContent).toBe("Overview");
  });

  it("wires each tab to the panel it controls", () => {
    const { getAllByRole, getByRole } = mount();
    const tab = getAllByRole("tab")[0]!;
    const panel = getByRole("tabpanel");
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });

  it("is one tab stop, with the arrows moving inside it", () => {
    const { getAllByRole } = mount();
    const [first, second] = getAllByRole("tab");
    expect(first!.getAttribute("tabindex"), "the selected tab is the tab stop").toBe("0");
    expect(second!.getAttribute("tabindex"), "the rest are reached with arrows").toBe("-1");
  });
});
