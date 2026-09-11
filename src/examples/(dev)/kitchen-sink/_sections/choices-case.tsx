import { createSignal } from "solid-js";
import {
  Checkbox,
  Field,
  Fieldset,
  Label,
  Radio,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Toggle,
} from "~/components/forms";
import { Case, Row } from "../_components/section";
import s from "../_components/sink.module.css";

/* One case per component — the rail is a catalog. The three that look alike get
   the same closing paragraph so the distinction is visible from any of them,
   rather than only from whichever one you happened to open. */

const LOOKALIKES = (
  <p class={s.limits}>
    <strong>
      Checkbox, Switch and Toggle look alike and are three different controls.
    </strong>{" "}
    A <em>checkbox</em> is a value you submit — nothing happens until the form
    does. A <em>switch</em> is a setting that takes effect immediately, so one
    inside a form with a Save button promises something the form will not
    deliver. A <em>toggle</em> is a button that stays pressed and changes the
    view rather than the data. Each announces itself differently, so picking
    wrong tells a reader something untrue about what will happen.
  </p>
);
export function ChoicesCases() {
  const [mixed, setMixed] = createSignal<boolean | "indeterminate">(
    "indeterminate",
  );
  return (
    <>
      <Case
        title="Checkbox"
        note="three states, and the third is not a styling of the other two"
      >
        <Row label="states">
          <span class={s.choice}>
            <Checkbox id="c1" defaultChecked />
            <Label for="c1">Checked</Label>
          </span>
          <span class={s.choice}>
            <Checkbox id="c2" />
            <Label for="c2">Unchecked</Label>
          </span>
          <span class={s.choice}>
            <Checkbox id="c3" checked={mixed()} onCheckedChange={setMixed} />
            <Label for="c3">Indeterminate</Label>
          </span>
          <span class={s.choice}>
            <Checkbox id="c4" disabled defaultChecked />
            <Label for="c4">Disabled</Label>
          </span>
        </Row>
        <p class={s.limits}>
          Indeterminate reports <code>aria-checked=&quot;mixed&quot;</code> — a
          real, announced third state. It is a{" "}
          <strong>state, not a variant</strong>: a variant is chosen by the
          author, a state comes from the data. Both glyphs live in the indicator
          and the state attribute decides which shows. The label sits outside so
          the whole phrase is the hit target.
        </p>
        {LOOKALIKES}
      </Case>

      <Case title="Switch" note="a setting that takes effect when you flip it">
        <Row label="states">
          <span class={s.choice}>
            <Switch id="s1" defaultChecked />
            <Label for="s1">On</Label>
          </span>
          <span class={s.choice}>
            <Switch id="s2" />
            <Label for="s2">Off</Label>
          </span>
          <span class={s.choice}>
            <Switch id="s3" disabled />
            <Label for="s3">Disabled</Label>
          </span>
        </Row>
        <p class={s.limits}>
          There is deliberately no loading state. A switch whose effect is
          asynchronous will be flipped back by a failure, and a spinner in the
          track does not explain that — make the surrounding region busy and let
          the failure surface where failures surface. A control that silently
          reverts is worse than one that never moved.
        </p>
        {LOOKALIKES}
      </Case>

      <Case title="Toggle" note="a button that stays pressed">
        <Row label="shapes">
          <Toggle aria-label="Bold" size="icon">
            B
          </Toggle>
          <Toggle defaultPressed>Pressed</Toggle>
          <Toggle shape="pill" size="sm">
            Filter
          </Toggle>
          <Toggle disabled>Disabled</Toggle>
        </Row>
        <p class={s.limits}>
          It reports <code>aria-pressed</code>, which is what makes it a toggle
          rather than a button that looks different when active. Pressed is a{" "}
          <strong>state the control reports</strong>, not a class a caller sets
          — the styling keys off the state attribute, so appearance and
          announcement cannot drift.
        </p>
        {LOOKALIKES}
      </Case>

      <Case
        title="Radio group"
        note="the group owns the value; the legend owns the question"
      >
        <Fieldset
          legend="Notify me"
          hint="Arrows move within the group; Tab leaves it."
        >
          <RadioGroup defaultValue="email">
            <span class={s.choice}>
              <Radio value="email" id="r1" />
              <Label for="r1">By email</Label>
            </span>
            <span class={s.choice}>
              <Radio value="sms" id="r2" />
              <Label for="r2">By SMS</Label>
            </span>
            <span class={s.choice}>
              <Radio value="none" id="r3" />
              <Label for="r3">Not at all</Label>
            </span>
          </RadioGroup>
        </Fieldset>
        <p class={s.limits}>
          One tab stop for the whole group, arrows within it — not one stop per
          option. A hand-rolled group almost always gets this wrong in the same
          direction, and a form with fifteen options then costs fifteen tab
          presses to walk past. The question is a <code>&lt;legend&gt;</code>{" "}
          rather than a prop here, because it has to be announced before{" "}
          <em>every</em> option.
        </p>
      </Case>

      <Case title="Select" note="a value bound to a form — not a menu">
        <div class={s.selectWidth}>
          <Field label="Region" hint="A value, not an action.">
            {(control) => (
              <Select
                defaultValue="eu"
                items={[
                  {
                    value: "eu",
                    label: "Europe",
                  },
                  {
                    value: "us",
                    label: "North America",
                  },
                  {
                    value: "ap",
                    label: "Asia Pacific",
                  },
                ]}
              >
                <SelectTrigger {...control}>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="us">North America</SelectItem>
                  <SelectItem value="ap">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>
        <p class={s.limits}>
          <strong>A select picks a value; a menu picks an action.</strong> They
          look nearly identical and are announced completely differently — one
          as a combobox with a current value, the other as a list of commands. A
          menu used for a value leaves a reader unable to discover what is
          selected. The list is portalled so an <code>overflow: hidden</code>{" "}
          ancestor cannot clip it, and the highlight follows{" "}
          <code>data-highlighted</code> rather than <code>:hover</code>, which
          the primitive sets for keyboard as well as pointer.
        </p>
      </Case>
    </>
  );
}
