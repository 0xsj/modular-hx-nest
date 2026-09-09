import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { AccessibleIcon, Check, Portal, VisuallyHidden } from "./index";

afterEach(cleanup);

describe("VisuallyHidden", () => {
  it("stays in the accessibility tree", () => {
    const { getByText } = render(() => <VisuallyHidden>not measured</VisuallyHidden>);
    const el = getByText("not measured");
    expect(el.hasAttribute("hidden"), "hidden removes it from the tree entirely").toBe(false);
    expect(el.getAttribute("aria-hidden")).toBeNull();
  });
});

describe("AccessibleIcon", () => {
  it("gives the glyph words, and hides the glyph", () => {
    const { container } = render(() => (
      <AccessibleIcon label="Degraded"><Check size={12} /></AccessibleIcon>
    ));
    expect(container.textContent, "the words are what the icon MEANS").toBe("Degraded");
    expect(container.querySelector("[aria-hidden='true']")!.querySelector("svg")).toBeTruthy();
  });

  /* An aria-label on an element with no role is ignored by some readers, and
   * role="img" makes an inline icon a separate object mid-sentence. */
  it("does not label the svg itself", () => {
    const { container } = render(() => (
      <AccessibleIcon label="Degraded"><Check size={12} /></AccessibleIcon>
    ));
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBeNull();
    expect(svg.getAttribute("role")).toBeNull();
  });
});

describe("Portal", () => {
  it("renders outside its parent box and inside the component tree", () => {
    const { container } = render(() => (
      <div id="host"><Portal><span data-portalled>elsewhere</span></Portal></div>
    ));
    expect(
      container.querySelector("[data-portalled]"),
      "the DOM position and the component position are different questions",
    ).toBeNull();
    expect(document.body.querySelector("[data-portalled]")).toBeTruthy();
  });
});
