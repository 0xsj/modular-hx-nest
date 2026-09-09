import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { For } from "solid-js";
import {
  Checkbox, Field, Fieldset, Input, Label, Radio, RadioGroup, Select, SelectContent,
  SelectHiddenSelect, SelectItem, SelectLabel, SelectTrigger, SelectValue,
  Switch, Textarea, Toggle, createListCollection,
} from "./index";

afterEach(cleanup);

/* The library's callbacks are dispatched on a microtask, not synchronously
 * with the click. Asserting straight after `fireEvent` reads the state from
 * before the event and passes for the wrong reason. */
const settled = () => Promise.resolve();

/* One file for the small controls. Each is a thin wrapper over a headless
 * primitive, so what is worth pinning is the CONTRACT this tree adds — the
 * role, the announced state, and the thing that would silently regress. */

describe("Checkbox", () => {
  /* The state lives on the native input's PROPERTIES, which is what the
   * accessibility tree reads; `indeterminate` has no attribute form at all,
   * so `aria-checked` is absent by design and asserting it tests nothing. */
  it("announces three states, and mixed is one of them", () => {
    const read = (el: HTMLInputElement) =>
      el.indeterminate ? "mixed" : el.checked ? "true" : "false";
    const at = (c: false | true | "indeterminate") => {
      const { container, unmount } = render(() => <Checkbox checked={c} />);
      const state = read(container.querySelector("input")!);
      unmount();
      return state;
    };
    expect(at(false)).toBe("false");
    expect(at(true)).toBe("true");
    expect(
      at("indeterminate"),
      "a third state that renders like the other two is not a third state",
    ).toBe("mixed");
  });

  it("submits, because a checkbox is a form value", () => {
    const { container } = render(() => <Checkbox name="agree" checked />);
    expect(
      container.querySelector("input[type='checkbox']"),
      "a styled div holds state in memory and submits nothing",
    ).toBeTruthy();
  });
});

describe("Switch", () => {
  it("is a switch, not a checkbox — the role is the promise", () => {
    const { getByRole } = render(() => <Switch />);
    expect(
      getByRole("switch"),
      "a switch implies its change already happened; a checkbox waits for Save",
    ).toBeTruthy();
  });

  it("carries its state where a native control does", () => {
    const { getByRole } = render(() => <Switch checked />);
    expect((getByRole("switch") as HTMLInputElement).checked).toBe(true);
  });
});

/* The pattern both docs prescribe: the control is 16px, so the words beside it
 * have to be the hit target and the accessible name. It only works if `id`
 * reaches the real input — the library would otherwise read it as a seed and
 * derive `checkbox:<id>:input`, leaving the caller's `for` pointing at
 * nothing. Asserted through the ROLE, because that is what reflects the
 * accessibility tree: the input also carries an `aria-labelledby` aimed at a
 * label part these wrappers do not render, and the name has to survive it. */
describe("Checkbox and Switch · a sibling Label names the control", () => {
  it("gives the caller's id to the input, and the root's `for` follows", () => {
    for (const Control of [Checkbox, Switch]) {
      const { container, unmount } = render(() => <Control id="ks-x" />);
      const input = container.querySelector("input")!;
      expect(input.id, "a seeded id leaves `for` pointing at nothing").toBe("ks-x");
      expect(container.querySelector("label[data-part='root']")!.getAttribute("for")).toBe("ks-x");
      unmount();
    }
  });

  it("is named by the label beside it", () => {
    const checkbox = render(() => (
      <><Checkbox id="a" /><Label for="a">Email</Label></>
    ));
    expect(checkbox.getByRole("checkbox", { name: "Email" })).toBeTruthy();
    checkbox.unmount();

    const toggle = render(() => (
      <><Switch id="b" /><Label for="b">Quiet hours</Label></>
    ));
    expect(toggle.getByRole("switch", { name: "Quiet hours" })).toBeTruthy();
  });

  it("works through Field, which supplies the id the same way", () => {
    const { container, getByRole } = render(() => (
      <Field label="Agree to terms">{(control) => <Checkbox {...control} />}</Field>
    ));
    const input = container.querySelector("input")!;
    const label = container.querySelector("label:not([data-part])")!;
    expect(label.getAttribute("for")).toBe(input.id);
    expect(getByRole("checkbox", { name: "Agree to terms" })).toBeTruthy();
  });
});

describe("Toggle", () => {
  it("is a button carrying aria-pressed, not a checkbox", () => {
    const { getByRole } = render(() => <Toggle pressed>Bold</Toggle>);
    const el = getByRole("button", { pressed: true });
    expect(el.getAttribute("aria-pressed")).toBe("true");
  });

  it("writes aria-pressed, which is what the stylesheet keys off", () => {
    const { getByRole } = render(() => <Toggle pressed={false}>Bold</Toggle>);
    expect(
      getByRole("button").getAttribute("aria-pressed"),
      "data-state is written by every primitive and collides when composed",
    ).toBe("false");
  });
});

describe("RadioGroup", () => {
  it("is one tab stop with a radiogroup role", () => {
    const { getByRole, getAllByRole } = render(() => (
      <RadioGroup value="a">
        <Radio value="a">Alpha</Radio>
        <Radio value="b">Bravo</Radio>
      </RadioGroup>
    ));
    expect(getByRole("radiogroup")).toBeTruthy();
    expect(getAllByRole("radio")).toHaveLength(2);
  });

  /* Measured, and the reason the wrapper's doc had to be corrected: a legend
   * names the FIELDSET, and the radiogroup inside it is a different element.
   * The composition that reads as obviously sufficient is not. */
  it("needs a name of its own — a fieldset legend is not one", () => {
    const wrapped = render(() => (
      <Fieldset legend="Retention">
        <RadioGroup><Radio value="a">A</Radio></RadioGroup>
      </Fieldset>
    ));
    expect(wrapped.queryByRole("group", { name: "Retention" })).toBeTruthy();
    expect(
      wrapped.queryByRole("radiogroup", { name: "Retention" }),
      "the legend names the fieldset, not the group inside it",
    ).toBeNull();
    wrapped.unmount();

    const named = render(() => (
      <RadioGroup aria-label="Retention"><Radio value="a">A</Radio></RadioGroup>
    ));
    expect(named.getByRole("radiogroup", { name: "Retention" })).toBeTruthy();
  });

  it("the option's words are part of the hit target", async () => {
    const onValueChange = vi.fn();
    const { getByText } = render(() => (
      <RadioGroup onValueChange={onValueChange}>
        <Radio value="a">Alpha</Radio>
      </RadioGroup>
    ));
    fireEvent.click(getByText("Alpha"));
    await settled();
    expect(onValueChange, "a 15px circle is not a hit target").toHaveBeenCalledWith(
      expect.objectContaining({ value: "a" }),
    );
  });
});

describe("Fieldset", () => {
  it("names the SET with a legend, which is announced before every control", () => {
    const { container, getByText } = render(() => (
      <Fieldset legend="Claimant"><Input aria-label="a" /></Fieldset>
    ));
    expect(container.querySelector("legend")).toBeTruthy();
    expect(getByText("Claimant").tagName).toBe("LEGEND");
  });

  it("keeps the wiring on the container, unlike Field", () => {
    const { container } = render(() => (
      <Fieldset legend="A" error="Pick one."><Input aria-label="a" /></Fieldset>
    ));
    const fs = container.querySelector("fieldset")!;
    expect(fs.getAttribute("aria-invalid")).toBe("true");
    const ids = fs.getAttribute("aria-describedby")!;
    expect(document.getElementById(ids)!.textContent).toBe("Pick one.");
  });

  /* A SOURCE assertion, and weaker for it. This environment applies no
   * cascade, so a CSS Module class never reaches `getComputedStyle` and the
   * computed value is "" for a rule that is present and one that was deleted
   * alike — see decisions/0002. What it still catches is the deletion, which
   * is the regression that actually happens: the browser default is
   * `min-inline-size: min-content`, and a fieldset that will not shrink below
   * its widest child overflows a grid for no visible reason. */
  it("resets min-inline-size, the one that causes unexplainable overflow", () => {
    const css = readFileSync("src/components/forms/fieldset/fieldset.module.css", "utf8");
    expect(css).toMatch(/min-inline-size:\s*0/);
  });
});

describe("Input and Textarea", () => {
  it("are two elements sharing one variant set", () => {
    const { container } = render(() => (<><Input aria-label="a" /><Textarea aria-label="b" /></>));
    const input = container.querySelector("input")!;
    const textarea = container.querySelector("textarea")!;
    const shared = [...input.classList].filter((c) => textarea.classList.contains(c));
    expect(shared.length, "the border, ring and invalid state must not drift").toBeGreaterThan(0);
  });

  it("neither invents an invalid state — Field supplies it", () => {
    const { container } = render(() => <Input aria-label="a" />);
    expect(container.querySelector("input")!.hasAttribute("aria-invalid")).toBe(false);
  });
});

describe("Label", () => {
  it("does not generate an id — `for` is the caller's", () => {
    const { container } = render(() => <Label for="x">Name</Label>);
    expect(container.querySelector("label")!.getAttribute("for")).toBe("x");
  });
});

describe("Select", () => {
  const collection = createListCollection({
    items: [
      { label: "One", value: "1" },
      { label: "Two", value: "2" },
    ],
  });

  const mount = () =>
    render(() => (
      <Select collection={collection}>
        <SelectLabel>Retention</SelectLabel>
        <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
        <SelectContent>
          <For each={collection.items}>{(i) => <SelectItem item={i}>{i.label}</SelectItem>}</For>
        </SelectContent>
        <SelectHiddenSelect />
      </Select>
    ));

  /* The trigger's id is generated, so an outside `<label for>` has nothing to
   * point at — without the library's own label part a Select cannot be named
   * at all, which is why the wrapper exposes one. */
  it("can be named, and the name reaches the combobox", () => {
    const { getByRole } = mount();
    expect(getByRole("combobox", { name: "Retention" })).toBeTruthy();
  });

  it("wears Label's look rather than a second copy of it", () => {
    const { container } = mount();
    const own = render(() => <Label>x</Label>);
    const theirs = container.querySelector("label")!;
    const ours = own.container.querySelector("label")!;
    expect(theirs.tagName, "asChild must yield the caller's element").toBe("LABEL");
    expect(
      [...theirs.classList].some((c) => ours.classList.contains(c)),
      "a select label styled from its own stylesheet drifts from every other label",
    ).toBe(true);
    own.unmount();
  });

  it("submits, which a styled div does not", () => {
    const { container } = mount();
    const hidden = container.querySelector("select")!;
    expect(hidden, "without the hidden select this holds a value in memory").toBeTruthy();
    expect([...hidden.options].map((o) => o.value)).toEqual(["", "1", "2"]);
  });

  /* A menu performs an action; a select holds a value. The roles are the
   * difference, and they are what a reader announces. */
  it("is a listbox of options, not a menu of items", () => {
    const { container } = mount();
    const listbox = container.querySelector('[role="listbox"]')!;
    expect(listbox, "a menu here would be announced as a set of actions").toBeTruthy();
    /* Scoped to the listbox on purpose: the hidden native select carries real
     * <option> elements of its own, so counting them page-wide would pass
     * whether or not the visible list has any. */
    expect(listbox.querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
});
