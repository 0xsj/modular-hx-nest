import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { internal, notFound } from "~/lib/kernel";
import {
  Avatar, Badge, Empty, Mock, Panel, Presence, Stat, TBody, THead, Table, Td, Th, Tr,
} from "./index";
import { initialsOf } from "./avatar/avatar";
import { UNMEASURED } from "./stat/stat";

afterEach(cleanup);

/* These assert on ACCESSIBLE OUTPUT — roles, names, announced text — because
 * a display component's job is to say what it is showing. A test on class
 * names passes on a component that shows the right pixels and says nothing. */

describe("Panel", () => {
  it("is a named region when it has a title", () => {
    const { getByRole } = render(() => <Panel title="Cameras">body</Panel>);
    expect(getByRole("region", { name: "Cameras" })).toBeTruthy();
  });

  it("is not an unnamed region when it has no title", () => {
    const { queryByRole, container } = render(() => <Panel>body</Panel>);
    expect(
      container.querySelector("section")!.hasAttribute("aria-labelledby"),
      "a nameless landmark is an entry in the regions list that says nothing",
    ).toBe(false);
    expect(queryByRole("region")).toBeNull();
  });

  it("puts the title in a heading, so the page outline includes it", () => {
    const { getByRole } = render(() => <Panel title="Cameras">body</Panel>);
    expect(getByRole("heading", { name: "Cameras" }).tagName).toBe("H2");
  });
});

describe("Badge", () => {
  it("announces its text once, and never the glyph", () => {
    const { container } = render(() => <Badge tone="crit" glyph="!">Failing</Badge>);
    const el = container.firstElementChild!;
    expect(el.textContent).toBe("!Failing");
    expect(
      el.querySelector("[aria-hidden='true']")!.textContent,
      "the colour and the mark are redundant channels; the word is the fact",
    ).toBe("!");
  });

  it("carries a tone class distinct from the default", () => {
    const a = render(() => <Badge>x</Badge>);
    const b = render(() => <Badge tone="crit">x</Badge>);
    expect([...a.container.firstElementChild!.classList]).not.toEqual(
      [...b.container.firstElementChild!.classList],
    );
  });
});

describe("Avatar", () => {
  it("is one labelled object, not a row of loose letters", () => {
    const { getByRole } = render(() => <Avatar name="Ada Byron King" />);
    const el = getByRole("img", { name: "Ada Byron King" });
    expect(el.textContent, "the initials must not be announced separately").toBe("AK");
  });

  it("takes the first and last word, and counts by code point", () => {
    expect(initialsOf("Ada Byron King")).toBe("AK");
    expect(initialsOf("Ada")).toBe("A");
    expect(initialsOf("  ada   lovelace  ")).toBe("AL");
    expect(initialsOf("")).toBe("");
    /* A surrogate pair sliced by index yields half a character, which renders
       as a replacement box. */
    expect(initialsOf("𝒜da Lovelace")).toBe("𝒜L");
  });

  it("keeps the name when an image is present, and does not repeat it", () => {
    const { container, getByRole } = render(() => (
      <Avatar name="Ada Lovelace" src="/a.png" />
    ));
    expect(getByRole("img", { name: "Ada Lovelace" })).toBeTruthy();
    expect(
      container.querySelector("img")!.getAttribute("alt"),
      "the wrapper carries the name; a second copy has a reader say it twice",
    ).toBe("");
  });
});

describe("Stat", () => {
  it("renders a measured zero as zero", () => {
    const { container } = render(() => <Stat label="Open" value={0} />);
    expect(container.textContent).toContain("0");
    expect(container.textContent).not.toContain(UNMEASURED);
  });

  it("renders an unmeasured value as a dash, and SAYS so", () => {
    const { container } = render(() => <Stat label="Open" />);
    expect(container.textContent).toContain(UNMEASURED);
    expect(
      container.textContent,
      "a dash is silent — the one user who needs telling is the one not told",
    ).toContain("not measured");
    expect(container.querySelector("[aria-hidden='true']")!.textContent).toBe(UNMEASURED);
  });
});

describe("Empty", () => {
  it("says what is absent", () => {
    const { getByText } = render(() => <Empty title="No cameras yet" />);
    expect(getByText("No cameras yet")).toBeTruthy();
  });
});

describe("Mock", () => {
  it("announces the disclaimer BEFORE the content it qualifies", () => {
    const { container } = render(() => <Mock note="Sample readings">42</Mock>);
    const text = container.textContent!;
    expect(text.indexOf("Sample readings")).toBeLessThan(text.indexOf("42"));
  });

  it("is greppable, so a release can assert a page has none", () => {
    const { container } = render(() => <Mock>x</Mock>);
    expect(container.querySelector("[data-mock]")).toBeTruthy();
  });

  it("states it even with no note", () => {
    const { container } = render(() => <Mock>x</Mock>);
    expect(container.textContent).toContain("not real data");
  });
});

describe("Presence", () => {
  const render3 = (of: Parameters<typeof Presence<string>>[0]["of"]) =>
    render(() => (
      <Presence of={of} empty="No cameras at this site.">
        {(v) => <span>{v}</span>}
      </Presence>
    ));

  it("renders the value when it was found", () => {
    const { container } = render3({ state: "found", value: "twelve" });
    expect(container.textContent).toBe("twelve");
  });

  it("renders the caller's sentence when nothing was found", () => {
    const { container } = render3({ state: "empty" });
    expect(container.textContent).toBe("No cameras at this site.");
  });

  it("does not say 'empty' when nobody looked", () => {
    const { container } = render3({ state: "unmeasured", failure: notFound("no route") });
    expect(container.textContent).not.toBe("No cameras at this site.");
    expect(container.textContent).toContain("could not be measured");
  });

  it("never prints the failure's diagnostic message", () => {
    const { container } = render3({
      state: "unmeasured",
      failure: internal("pg: relation \"cameras\" does not exist"),
    });
    expect(
      container.textContent,
      "message is written for whoever reads the logs, in someone else's voice",
    ).not.toContain("relation");
  });

  it("hands the failure to a caller that wants to say more", () => {
    const { container } = render(() => (
      <Presence
        of={{ state: "unmeasured", failure: notFound("x") }}
        empty="none"
        unmeasured={(f) => <span>kind:{f.kind}</span>}
      >
        {(v) => <span>{String(v)}</span>}
      </Presence>
    ));
    expect(container.textContent).toBe("kind:not_found");
  });
});

describe("Table", () => {
  const mount = () =>
    render(() => (
      <Table caption="Cameras by site">
        <THead><Tr><Th>Site</Th><Th numeric>Count</Th></Tr></THead>
        <TBody><Tr><Td>EU-West</Td><Td numeric>12</Td></Tr></TBody>
      </Table>
    ));

  it("is a real table a reader can navigate", () => {
    const { getByRole, getAllByRole } = mount();
    expect(getByRole("table", { name: "Cameras by site" })).toBeTruthy();
    expect(getAllByRole("columnheader")).toHaveLength(2);
    expect(getAllByRole("cell")).toHaveLength(2);
  });

  it("gives every header a scope, defaulting to the column", () => {
    const { container } = mount();
    for (const th of container.querySelectorAll("th")) {
      expect(th.getAttribute("scope"), "an ambiguous header is worse than none").toBe("col");
    }
  });

  it("lets a row header say so", () => {
    const { container } = render(() => (
      <Table><TBody><Tr><Th scope="row">EU-West</Th><Td>12</Td></Tr></TBody></Table>
    ));
    expect(container.querySelector("th")!.getAttribute("scope")).toBe("row");
  });

  it("makes the overflow reachable from the keyboard", () => {
    const { getByRole } = mount();
    const region = getByRole("region", { name: "Cameras by site" });
    expect(
      region.getAttribute("tabindex"),
      "columns past the fold are unreachable without a pointer otherwise",
    ).toBe("0");
    expect(region.tagName, "the scroll must not be on the table itself").toBe("DIV");
  });
});
