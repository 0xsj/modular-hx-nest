import { cleanup, render } from "@solidjs/testing-library";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { Heading, SectionLabel, Text } from "./index";

afterEach(cleanup);

describe("Heading · level and size are different decisions", () => {
  it("renders the level it was given, not the one the size implies", () => {
    const { getByRole } = render(() => <Heading level={3} size="display">Big but third</Heading>);
    const h = getByRole("heading", { level: 3 });
    expect(h.tagName, "picking the tag that looks right is how an outline becomes a type scale").toBe("H3");
  });

  it("renders the same size at any level", () => {
    const a = render(() => <Heading level={1} size="sm">x</Heading>);
    const b = render(() => <Heading level={4} size="sm">x</Heading>);
    expect([...a.getByRole("heading").classList]).toEqual([...b.getByRole("heading").classList]);
  });

  it("covers every level", () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const r = render(() => <Heading level={level}>x</Heading>);
      expect(r.getByRole("heading", { level }).tagName).toBe(`H${level}`);
      r.unmount();
    }
  });
});

describe("Text", () => {
  it("is a paragraph by default", () => {
    const { container } = render(() => <Text>body</Text>);
    expect(container.firstElementChild!.tagName).toBe("P");
  });

  /* A `p` inside a `p` is invalid, and the browser silently closes the outer
   * one — a DOM that does not match the JSX, for no visible reason. */
  it("becomes a span for text inside a sentence", () => {
    const { container } = render(() => <Text as="span">inline</Text>);
    expect(container.firstElementChild!.tagName).toBe("SPAN");
  });

  it("keeps emphasis semantic rather than making it a weight", () => {
    const { container } = render(() => <Text as="strong">important</Text>);
    expect(
      container.firstElementChild!.tagName,
      "weight is appearance; strong is announced",
    ).toBe("STRONG");
  });

  /* Only the COUNT travels inline, as a custom property. The prefixed
   * declarations live in the stylesheet: set inline they go through the CSSOM,
   * which drops the properties it does not recognise and leaves a element with
   * `overflow: hidden` and no clamp — measured. */
  it("passes the line count as a custom property the CSSOM cannot drop", () => {
    const { container } = render(() => <Text lines={2}>long</Text>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--text-clamp-lines")).toBe("2");
    expect([...el.classList].length, "and the clamp class carries the rest").toBeGreaterThan(1);
  });

  it("does not clamp when it was not asked to", () => {
    const { container } = render(() => <Text>long</Text>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--text-clamp-lines")).toBe("");
  });

  it("keeps the clamp declarations in CSS, where nothing validates them away", () => {
    const css = readFileSync("src/components/typography/text/text.module.css", "utf8");
    expect(css).toMatch(/-webkit-line-clamp:\s*var\(--text-clamp-lines/);
    expect(css).toMatch(/-webkit-box-orient:\s*vertical/);
    expect(css).toMatch(/display:\s*-webkit-box/);
  });
});

describe("SectionLabel", () => {
  /* A dozen two-word fragments in the outline makes the outline useless for
   * the thing it is for. */
  it("stays out of the document outline by default", () => {
    const { queryByRole, container } = render(() => <SectionLabel>Retention</SectionLabel>);
    expect(queryByRole("heading")).toBeNull();
    expect(container.firstElementChild!.tagName).toBe("DIV");
  });

  it("becomes a heading when it genuinely names a region", () => {
    const { getByRole } = render(() => <SectionLabel as="h3">Retention</SectionLabel>);
    expect(getByRole("heading", { level: 3 })).toBeTruthy();
  });

  /* The transform is CSS, so the accessible name keeps the case it was
   * written in — some readers spell out a fully-capitalised word. */
  it("keeps the text in the case it was written", () => {
    const { container } = render(() => <SectionLabel>Retention</SectionLabel>);
    expect(container.textContent).toBe("Retention");
  });
});
