import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Alert, Skeleton, SkeletonText } from "./index";

afterEach(cleanup);

describe("Alert", () => {
  /* A live region is a promise that its contents are NEW. Most alerts render
   * with the page, so the default has to be off — an always-present assertive
   * region trains a user to ignore the one that matters. */
  it("is not a live region unless asked", () => {
    const { container, queryByRole } = render(() => <Alert>Saved.</Alert>);
    expect(queryByRole("alert")).toBeNull();
    expect(queryByRole("status")).toBeNull();
    expect(container.firstElementChild!.hasAttribute("role")).toBe(false);
  });

  it("takes the role that matches the urgency asked for", () => {
    const polite = render(() => <Alert live="polite">Export ready.</Alert>);
    expect(polite.getByRole("status")).toBeTruthy();
    polite.unmount();

    const loud = render(() => (
      <Alert live="assertive" tone="crit">
        Payment failed.
      </Alert>
    ));
    expect(loud.getByRole("alert")).toBeTruthy();
  });

  /* role=alert/status imply aria-atomic, which is the half people miss when
   * they reach for aria-live directly — without it a reader announces the
   * diff, so a changed word arrives with no sentence around it. */
  it("uses the role rather than restating aria-live", () => {
    const { getByRole } = render(() => <Alert live="assertive">x</Alert>);
    const el = getByRole("alert");
    expect(el.hasAttribute("aria-live"), "the role already implies it").toBe(
      false,
    );
  });

  it("says the tone for the two where it changes what you do", () => {
    const crit = render(() => <Alert tone="crit">Card declined.</Alert>);
    expect(crit.container.textContent).toContain("Error");
    crit.unmount();

    const warn = render(() => <Alert tone="warn">Nearly full.</Alert>);
    expect(warn.container.textContent).toContain("Warning");
    warn.unmount();

    /* And stays quiet for the ones where it would be a syllable and no fact. */
    const info = render(() => <Alert tone="info">Export ready.</Alert>);
    expect(info.container.textContent).toBe("Export ready.");
  });

  it("hides the glyph, because the words carry the meaning", () => {
    const { container } = render(() => (
      <Alert tone="crit">Card declined.</Alert>
    ));
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no dismiss control unless it was given a handler", () => {
    const { queryByRole } = render(() => <Alert>x</Alert>);
    expect(
      queryByRole("button"),
      "a primitive does not manufacture the handler, so it cannot offer the control",
    ).toBeNull();
  });

  it("names the dismiss control, and calls only what it was given", () => {
    const onDismiss = vi.fn();
    const { getByRole } = render(() => <Alert onDismiss={onDismiss}>x</Alert>);
    const button = getByRole("button", { name: "Dismiss" });
    expect(
      button.getAttribute("type"),
      "a bare button in a form submits it",
    ).toBe("button");
    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("lets the caller name the dismiss control", () => {
    const { getByRole } = render(() => (
      <Alert onDismiss={() => {}} dismissLabel="Hide this warning">
        x
      </Alert>
    ));
    expect(getByRole("button", { name: "Hide this warning" })).toBeTruthy();
  });

  it("does not hide itself", () => {
    const onDismiss = vi.fn();
    const { getByRole, container } = render(() => (
      <Alert onDismiss={onDismiss}>Still here.</Alert>
    ));
    fireEvent.click(getByRole("button"));
    expect(
      container.textContent,
      "visibility is the caller's state; an alert that vanishes is unrecoverable",
    ).toContain("Still here.");
  });
});

describe("Skeleton", () => {
  /* The whole contract. A skeleton is a picture of a paragraph, and reading
   * "blank blank blank" to somebody is worse than reading nothing. */
  it("is hidden from readers", () => {
    const { container } = render(() => <Skeleton />);
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("announces nothing at all, which is why a caller must", () => {
    const { container } = render(() => (
      <div>
        <SkeletonText lines={3} />
      </div>
    ));
    expect(
      container.querySelectorAll("[aria-hidden='true']").length,
      "a screen of skeletons tells a reader the page is loaded and empty",
    ).toBeGreaterThan(0);
    expect(container.textContent).toBe("");
  });

  it("takes a size, and fills its container otherwise", () => {
    const sized = render(() => <Skeleton width="120px" height="8px" />);
    const style = sized.container.firstElementChild!.getAttribute("style")!;
    expect(style).toContain("inline-size: 120px");
    expect(style).toContain("block-size: 8px");
  });

  it("ends the last line short, so the block does not read as a table", () => {
    const { container } = render(() => <SkeletonText lines={3} />);
    const bars = [...container.querySelectorAll("span > span")];
    expect(bars).toHaveLength(3);
    const last = bars[bars.length - 1]!.getAttribute("style")!;
    expect(last).toContain("62%");
    expect(bars[0]!.getAttribute("style")).toContain("100%");
  });

  it("never renders zero lines", () => {
    const { container } = render(() => <SkeletonText lines={0} />);
    expect(container.querySelectorAll("span > span")).toHaveLength(1);
  });

  it("stops the animation entirely under reduced motion", () => {
    /* A source assertion: this environment applies no cascade, so the media
     * query cannot be evaluated — see decisions/0002. What it catches is the
     * rule being deleted, and `animation: none` rather than a zero duration,
     * which for an infinite iteration count is a different thing. */
    const css = readFileSync(
      "src/components/feedback/skeleton/skeleton.module.css",
      "utf8",
    );
    const reduced = css.slice(css.indexOf("prefers-reduced-motion"));
    expect(reduced).toMatch(/animation:\s*none/);
  });
});
