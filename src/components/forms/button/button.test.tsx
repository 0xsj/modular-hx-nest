import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";
import type { ButtonIntent, ButtonSize } from "./button.variants";

/* Unit tests for the contract in `doc.ts` §3, clause by clause.
 *
 * These are NOT spec tests — `flover-solid ADR 0001` puts that barrier on
 * `src/lib/**` and keeps it off components. These were written with the
 * implementation in view, so they can catch a regression and cannot catch a
 * bug that is already here. That is the accepted trade and it is why the
 * clause numbers matter: the contract came first, so what is asserted below
 * was decided before the code, even though the assertions were not.
 *
 * Case names read as claims. Failure messages carry the reason the rule
 * exists, not just got/want, so a red run in CI explains itself. */

afterEach(cleanup);

const INTENTS: ButtonIntent[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ButtonSize[] = ["sm", "md", "lg", "icon"];

const classesOf = (el: Element) => el.className.trim().split(/\s+/).filter(Boolean);

describe("B1 · it renders exactly one button", () => {
  it("renders a single <button> and no wrapper", () => {
    const { container } = render(() => <Button>Save</Button>);
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
  });
});

describe("B2 · type defaults to button", () => {
  it("defaults to type=button, so a button in a form does not also submit", () => {
    const { getByRole } = render(() => <Button>Apply</Button>);
    expect(
      getByRole("button").getAttribute("type"),
      "a <button> in a form defaults to type=submit; without this, onClick runs AND the form submits",
    ).toBe("button");
  });

  it("still lets a caller ask for submit", () => {
    const { getByRole } = render(() => <Button type="submit">Send</Button>);
    expect(getByRole("button").getAttribute("type")).toBe("submit");
  });
});

describe("B3 · every intent x size produces a usable class string", () => {
  for (const intent of INTENTS) {
    for (const size of SIZES) {
      it(`${intent} + ${size} yields classes with no undefined in them`, () => {
        const { getByRole } = render(() =>
          <Button intent={intent} size={size} aria-label="x">go</Button>);
        const cls = getByRole("button").className;
        expect(cls.length, "an empty class list means the variant map returned nothing").toBeGreaterThan(0);
        expect(
          cls,
          "a variant key present in the type and absent from the cva map is a runtime undefined in the class list",
        ).not.toMatch(/undefined|null/);
        /* base + intent + size. Their TEXT is never asserted — doc.ts §6. */
        expect(classesOf(getByRole("button")).length).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it("applies the defaults when neither axis is passed", () => {
    const { getByRole } = render(() => <Button>go</Button>);
    expect(classesOf(getByRole("button")).length).toBeGreaterThanOrEqual(3);
    expect(getByRole("button").className).not.toMatch(/undefined|null/);
  });
});

describe("B4 · a caller's class is composed, never replacing the variants", () => {
  it("keeps both the variant classes and the caller's", () => {
    const { getByRole } = render(() => <Button class="mine">go</Button>);
    const cls = classesOf(getByRole("button"));
    expect(cls).toContain("mine");
    expect(
      cls.length,
      "the caller's class replaced the variant classes instead of joining them",
    ).toBeGreaterThan(1);
  });
});

describe("B5 · children are rendered", () => {
  it("renders what it was given", () => {
    const { getByRole } = render(() => <Button>Save changes</Button>);
    expect(getByRole("button").textContent).toBe("Save changes");
  });
});

describe("B6/B7 · disabled and loading are one inert state", () => {
  it("disabled carries the real disabled attribute, not a styled imitation", () => {
    const { getByRole } = render(() => <Button disabled>go</Button>);
    expect(
      (getByRole("button") as HTMLButtonElement).disabled,
      "dimming a control is not disabling it — the platform attribute is unfocusable and announced",
    ).toBe(true);
  });

  it("loading is inert too, without the caller saying disabled", () => {
    const { getByRole } = render(() => <Button loading>go</Button>);
    expect(
      (getByRole("button") as HTMLButtonElement).disabled,
      "inert is disabled || loading; a loading button that is still clickable submits twice",
    ).toBe(true);
  });
});

describe("B8/B9 · state flags are absent, never the string false", () => {
  it("sets data-disabled and data-loading only when true", () => {
    const { getByRole } = render(() => <Button loading>go</Button>);
    const el = getByRole("button");
    expect(el.getAttribute("data-disabled")).not.toBeNull();
    expect(el.getAttribute("data-loading")).not.toBeNull();
    expect(el.getAttribute("aria-busy")).toBe("true");
  });

  it("omits them entirely when the button is idle", () => {
    const { getByRole } = render(() => <Button>go</Button>);
    const el = getByRole("button");
    for (const attr of ["data-disabled", "data-loading", "aria-busy"]) {
      expect(
        el.getAttribute(attr),
        `${attr}="false" still matches [${attr}], which would style every idle button as inert`,
      ).toBeNull();
    }
  });
});

describe("B10 · a loading button keeps its accessible name", () => {
  it("does not swap the label for an indicator", () => {
    const { getByRole } = render(() => <Button loading>Saving</Button>);
    expect(
      getByRole("button").textContent,
      "the indicator is a pseudo-element precisely so it cannot replace the name",
    ).toBe("Saving");
  });
});

describe("B11/B12 · handlers are passed through, never manufactured", () => {
  /* Solid never emits an `on*` ATTRIBUTE — it delegates through a `$$name`
     property on the element. The first version of this test read
     `el.attributes` and was therefore vacuous: it asserted [] against
     something that is [] whether or not a handler was manufactured. Found by
     mutation — the mutant that adds a swallowing handler was killed by the
     test below rather than by this one. The control that follows is what keeps
     this assertion able to fail. */
  it("attaches no delegated handler when none was given", () => {
    const { getByRole } = render(() => <Button>go</Button>);
    const el = getByRole("button") as unknown as Record<string, unknown>;
    expect(
      Object.keys(el).filter((k) => k.startsWith("$$")),
      "a primitive that synthesises a handler takes on a capability requirement its callers never agreed to",
    ).toEqual([]);
  });

  it("control — the same assertion DOES see a handler that was given", () => {
    const { getByRole } = render(() => <Button onClick={() => {}}>go</Button>);
    const el = getByRole("button") as unknown as Record<string, unknown>;
    expect(
      Object.keys(el).filter((k) => k.startsWith("$$")),
      "if this is empty the check above cannot fail, and is measuring nothing",
    ).toContain("$$click");
  });

  it("runs the caller's handler unwrapped", () => {
    let calls = 0;
    const { getByRole } = render(() => <Button onClick={() => calls++}>go</Button>);
    fireEvent.click(getByRole("button"));
    expect(calls).toBe(1);
  });

  it("does not swallow the click by substituting its own handler when inert", () => {
    let calls = 0;
    const { getByRole } = render(() => <Button disabled onClick={() => calls++}>go</Button>);
    fireEvent.click(getByRole("button"));
    expect(
      calls,
      "the native disabled attribute stops the click — no wrapper handler is needed or allowed",
    ).toBe(0);
  });
});

describe("B13/B14/B15 · asChild hands the props over", () => {
  it("renders the caller's element and no button at all", () => {
    const { container } = render(() => (
      <Button asChild={(props) => <a href="/x" {...props()}>Go</a>} />
    ));
    expect(
      container.querySelectorAll("button"),
      "asChild must produce ONE element — a button wrapping a link is two",
    ).toHaveLength(0);
    const a = container.querySelector("a")!;
    expect(a.textContent).toBe("Go");
    expect(classesOf(a).length, "the variant classes must land on the caller's element").toBeGreaterThanOrEqual(3);
  });

  it("marks an inert link with aria-disabled and takes it out of the tab order", () => {
    const { container } = render(() => (
      <Button disabled asChild={(props) => <a href="/x" {...props()}>Go</a>} />
    ));
    const a = container.querySelector("a")!;
    expect(a.getAttribute("aria-disabled")).toBe("true");
    expect(a.getAttribute("tabindex")).toBe("-1");
    expect(
      a.hasAttribute("disabled"),
      "the disabled attribute means nothing on an anchor; aria-disabled is what announces",
    ).toBe(false);
  });

  it("does not put type on an anchor", () => {
    const { container } = render(() => (
      <Button asChild={(props) => <a href="/x" {...props()}>Go</a>} />
    ));
    expect(container.querySelector("a")!.hasAttribute("type")).toBe(false);
  });

  it("composes a caller's handler rather than replacing it", () => {
    let calls = 0;
    const { container } = render(() => (
      <Button asChild={(props) => <a href="#" onClick={() => calls++} {...props()}>Go</a>} />
    ));
    fireEvent.click(container.querySelector("a")!);
    expect(calls, "the merge composes on* handlers; the caller's runs first").toBe(1);
  });
});

describe("B16 · the href gap is real, and this pins it as known", () => {
  /* Not a passing behaviour — a documented limitation. Asserting it means the
     day somebody "fixes" it by manufacturing a handler, this test fails and
     points at doc.ts §B11 rather than letting the fix land quietly. */
  it("leaves href in place on an inert link, because it cannot remove it", () => {
    const { container } = render(() => (
      <Button disabled asChild={(props) => <a href="/x" {...props()}>Go</a>} />
    ));
    expect(
      container.querySelector("a")!.getAttribute("href"),
      "the rule is about call sites: do not render a link you do not want followed",
    ).toBe("/x");
  });
});
