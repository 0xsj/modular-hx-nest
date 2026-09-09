import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Box, Container, Flex, Separator, SPACE_KEYS, spaceStyle } from "./index";

afterEach(cleanup);

const styleOf = (el: Element) => el.getAttribute("style") ?? "";

describe("spaceStyle", () => {
  it("maps steps to tokens, and zero to a literal", () => {
    expect(spaceStyle({ p: 3 })).toEqual({ padding: "var(--space-3)" });
    expect(spaceStyle({ p: 0 }), "there is no --space-0, and zero is not a size").toEqual({
      padding: "0",
    });
    expect(spaceStyle({ m: "auto" })).toEqual({ margin: "auto" });
  });

  it("emits nothing for a prop that was not given", () => {
    expect(spaceStyle({})).toEqual({});
  });

  it("uses LOGICAL properties, so a layout mirrors correctly", () => {
    expect(spaceStyle({ ps: 2 })).toEqual({ "padding-inline-start": "var(--space-2)" });
    expect(spaceStyle({ px: 2 })).toEqual({ "padding-inline": "var(--space-2)" });
    expect(SPACE_KEYS, "a physical side cannot be expressed").not.toContain("pl");
  });

  /* Insertion order decides which declaration wins, so the broadest has to be
   * written first or a longhand override is silently discarded. */
  it("orders the shorthand before the longhand it may be overridden by", () => {
    const keys = Object.keys(spaceStyle({ pt: 0, p: 4 }));
    expect(keys).toEqual(["padding", "padding-block-start"]);
  });
});

describe("Box", () => {
  it("has no appearance of its own", () => {
    const { container } = render(() => <Box>x</Box>);
    const cls = container.firstElementChild!.getAttribute("class");
    expect(cls, "a box that can be styled lets a screen restyle a primitive").toBeNull();
  });

  it("carries spacing as logical properties", () => {
    const { container } = render(() => <Box p={4} mx="auto" />);
    const style = styleOf(container.firstElementChild!);
    expect(style).toContain("padding: var(--space-4)");
    expect(style).toContain("margin-inline: auto");
  });

  it("lets the caller's style win", () => {
    const { container } = render(() => <Box p={4} style={{ padding: "1px" }} />);
    expect(styleOf(container.firstElementChild!)).toContain("padding: 1px");
  });

  /* The trap from the field wrapper, in the other direction: building the
   * style object in the component body would read the step once. */
  it("updates a step that changes, rather than freezing it", () => {
    const [step, setStep] = createSignal<0 | 4>(0);
    const { container } = render(() => <Box p={step()} />);
    const el = container.firstElementChild!;
    expect(styleOf(el)).toContain("padding: 0");
    setStep(4);
    expect(styleOf(el), "a frozen style is correct on first paint and never again")
      .toContain("padding: var(--space-4)");
  });

  it("becomes the caller's element rather than wrapping it", () => {
    const { container } = render(() => (
      <Box p={2} asChild={(props) => <section {...props()}>x</section>} />
    ));
    expect(container.querySelector("div"), "a wrapper changes the layout it describes").toBeNull();
    expect(styleOf(container.querySelector("section")!)).toContain("padding: var(--space-2)");
  });
});

describe("Flex", () => {
  it("is a flex row by default", () => {
    const { container } = render(() => <Flex>x</Flex>);
    expect(styleOf(container.firstElementChild!)).toContain("display: flex");
  });

  it("takes a gap STEP, not a length", () => {
    const { container } = render(() => <Flex gap={3} />);
    expect(styleOf(container.firstElementChild!)).toContain("gap: var(--space-3)");
  });

  it("sets min-inline-size, the one that causes unexplainable overflow", () => {
    const { container } = render(() => <Flex />);
    expect(
      styleOf(container.firstElementChild!),
      "a flex child refuses to shrink below its content and nothing in the CSS says so",
    ).toContain("min-inline-size: 0");
  });

  /* Asserted as longhands because the CSSOM expands the shorthand, and
   * `flex-basis` is the half that matters: `flex-grow: 1` alone leaves the
   * basis at `auto`, so children share the LEFTOVER space in proportion to
   * their content instead of sharing the space equally. That is the bug this
   * prop exists to spell away, and it looks almost right on screen. */
  it("spells `grow` correctly so a caller does not have to", () => {
    const { container } = render(() => <Flex grow />);
    const style = styleOf(container.firstElementChild!);
    expect(style).toContain("flex-grow: 1");
    expect(style).toMatch(/flex-basis:\s*0(px)?/);
  });
});

describe("Container", () => {
  it("distinguishes a page from a reading measure", () => {
    const page = render(() => <Container>x</Container>);
    const measure = render(() => <Container width="measure">x</Container>);
    expect([...page.container.firstElementChild!.classList]).not.toEqual(
      [...measure.container.firstElementChild!.classList],
    );
  });
});

describe("Separator", () => {
  /* BOTH channels are asserted, and separately. `aria-hidden` alone removes
   * the element from the tree whatever its role says, so a role assertion
   * standing behind it can never fail — it would pass on a separator that
   * claims to be one and is hidden anyway. */
  it("is decorative by default, and absent from the tree", () => {
    const { container, queryByRole } = render(() => <Separator />);
    const el = container.firstElementChild!;
    expect(el.getAttribute("role"), "the role must say none, not merely be hidden").toBe("none");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(queryByRole("separator")).toBeNull();
  });

  it("is announced when it is asked to be", () => {
    const { getByRole } = render(() => <Separator decorative={false} />);
    expect(getByRole("separator")).toBeTruthy();
  });

  it("states its orientation only when that is meaningful", () => {
    const v = render(() => <Separator decorative={false} orientation="vertical" />);
    expect(v.getByRole("separator").getAttribute("aria-orientation")).toBe("vertical");
    v.unmount();
    const h = render(() => <Separator decorative={false} />);
    expect(
      h.getByRole("separator").getAttribute("aria-orientation"),
      "horizontal is the role's default; restating it is noise",
    ).toBeNull();
  });
});
