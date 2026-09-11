import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "../input";
import { Field } from "./field";

afterEach(cleanup);

/* The wiring is the component. These assert on ACCESSIBLE OUTPUT — ids,
 * described-by, invalid — never on class names, because a test that asserts a
 * class passes on a component that announces nothing. */

describe("Field · the label points at the control", () => {
  it("associates by id, and the id is on the control the caller rendered", () => {
    const { getByLabelText } = render(() => (
      <Field label="Host">{(c) => <Input {...c} />}</Field>
    ));
    expect(
      getByLabelText("Host").tagName,
      "the label must reach the control, not a wrapper",
    ).toBe("INPUT");
  });

  it("survives the control being nested, which is where cloning fails silently", () => {
    const { getByLabelText } = render(() => (
      <Field label="Host">
        {(c) => (
          <div>
            <span>
              <Input {...c} />
            </span>
          </div>
        )}
      </Field>
    ));
    expect(getByLabelText("Host").tagName).toBe("INPUT");
  });

  it("two fields with the same label do not collide", () => {
    const { getAllByLabelText } = render(() => (
      <>
        <Field label="Name">{(c) => <Input {...c} />}</Field>
        <Field label="Name">{(c) => <Input {...c} />}</Field>
      </>
    ));
    const [a, b] = getAllByLabelText("Name");
    expect(a.id).not.toBe(b.id);
    expect(a.id).not.toBe("");
  });
});

describe("Field · described-by", () => {
  it("is absent when there is neither an error nor a hint", () => {
    const { getByLabelText } = render(() => (
      <Field label="Host">{(c) => <Input {...c} />}</Field>
    ));
    expect(
      getByLabelText("Host").hasAttribute("aria-describedby"),
      "absent, never empty",
    ).toBe(false);
  });

  it("names the ERROR first and the hint second", () => {
    const { getByLabelText, getByText } = render(() => (
      <Field label="Host" hint="One per line" error="That is not a hostname.">
        {(c) => <Input {...c} />}
      </Field>
    ));
    const ids = getByLabelText("Host")
      .getAttribute("aria-describedby")!
      .split(" ");
    expect(ids).toHaveLength(2);
    expect(
      document.getElementById(ids[0])!.textContent,
      "somebody who just failed validation hears what is wrong before the standing advice",
    ).toBe("That is not a hostname.");
    expect(document.getElementById(ids[1])!.textContent).toBe("One per line");
    expect(getByText("One per line")).toBeTruthy();
  });

  it("does not replace the hint with the error", () => {
    const { queryByText } = render(() => (
      <Field label="Host" hint="One per line" error="Bad.">
        {(c) => <Input {...c} />}
      </Field>
    ));
    expect(
      queryByText("One per line"),
      "the instruction is still true while the field is wrong",
    ).toBeTruthy();
  });
});

describe("Field · absent, never false", () => {
  it("sets aria-invalid only when there is an error", () => {
    const { getByLabelText, unmount } = render(() => (
      <Field label="A">{(c) => <Input {...c} />}</Field>
    ));
    expect(
      getByLabelText("A").getAttribute("aria-invalid"),
      'aria-invalid="false" still matches [aria-invalid] and would style every valid field as an error',
    ).toBeNull();
    unmount();

    const withError = render(() => (
      <Field label="B" error="no">
        {(c) => <Input {...c} />}
      </Field>
    ));
    expect(withError.getByLabelText("B").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  /* Asserted through the ACCESSIBLE NAME rather than the label's text.
     The asterisk lives inside the <label>, so `textContent` is "A*" — but it is
     aria-hidden, so the accessible name is "A". Those differing is the whole
     point of the mark being hidden, and only a role query can see it. */
  it("sets required only when required, and the mark is not announced", () => {
    const { getByRole, container } = render(() => (
      <Field label="A" required>
        {(c) => <Input {...c} />}
      </Field>
    ));
    const control = getByRole("textbox", { name: "A" }) as HTMLInputElement;
    expect(control.required, "the attribute is the announcement").toBe(true);
    expect(
      container.querySelector("label")!.textContent,
      "the mark is present visually",
    ).toBe("A*");
    expect(
      control.getAttribute("aria-describedby"),
      'hearing "star" after every label is noise, so the mark is not described either',
    ).toBeNull();
  });

  it("omits required when it was not asked for", () => {
    const { getByRole } = render(() => (
      <Field label="B">{(c) => <Input {...c} />}</Field>
    ));
    expect(
      (getByRole("textbox", { name: "B" }) as HTMLInputElement).required,
    ).toBe(false);
  });
});

/* The render prop is called ONCE, and everything after that is an attribute
 * update on the element it already returned. The alternative — reading the
 * values while building the props object — also produces correct attributes,
 * which is what makes it dangerous: the only observable difference is that the
 * control is a different element than it was. */
describe("Field · a late error updates the control, it does not replace it", () => {
  it("keeps the element, the value in it and the focus on it", () => {
    const [error, setError] = createSignal<string | undefined>();
    let calls = 0;
    const { container } = render(() => (
      <Field label="Address" error={error()}>
        {(control) => {
          calls++;
          return <Input {...control} />;
        }}
      </Field>
    ));

    const before = container.querySelector("input")!;
    before.value = "ops@";
    before.focus();

    setError("That address has no domain.");

    const after = container.querySelector("input")!;
    expect(calls, "the render prop must not re-run").toBe(1);
    expect(after, "a replaced control is a new element").toBe(before);
    expect(
      after.value,
      "validation fires on blur — losing what was typed is losing it exactly then",
    ).toBe("ops@");
    expect(document.activeElement, "and focus goes with it").toBe(after);
  });

  it("still tracks: describedby, invalid and required all follow, both ways", () => {
    const [error, setError] = createSignal<string | undefined>();
    const [hint, setHint] = createSignal<string | undefined>();
    const [required, setRequired] = createSignal(false);
    const { container } = render(() => (
      <Field label="A" error={error()} hint={hint()} required={required()}>
        {(c) => <Input {...c} />}
      </Field>
    ));
    const input = container.querySelector("input")!;
    const state = () => ({
      invalid: input.getAttribute("aria-invalid"),
      describedBy: input.getAttribute("aria-describedby"),
      required: input.hasAttribute("required"),
    });

    expect(state()).toEqual({
      invalid: null,
      describedBy: null,
      required: false,
    });

    setHint("Use twelve characters.");
    expect(state().describedBy).toMatch(/-hint$/);

    setError("Too short.");
    expect(state().invalid).toBe("true");
    /* Error first — a reader announces them in this order and the error is
       the more urgent of the two. */
    expect(state().describedBy).toMatch(/-error .*-hint$/);

    setRequired(true);
    expect(state().required).toBe(true);

    /* The direction that a one-way binding gets wrong. */
    setError(undefined);
    expect(
      state().invalid,
      "aria-invalid must be removed, not set to false",
    ).toBeNull();
    expect(state().describedBy).toMatch(/-hint$/);
  });
});
