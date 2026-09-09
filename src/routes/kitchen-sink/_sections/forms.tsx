import { For, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import {
  Button, Checkbox, Field, Fieldset, Input, Label, Radio, RadioGroup, Select,
  SelectContent, SelectHiddenSelect, SelectItem, SelectLabel, SelectTrigger,
  SelectValue, Switch, Textarea, Toggle, createListCollection,
  type ButtonIntent, type ButtonSize,
} from "~/components/forms";
import { Check, X } from "~/components/utility";
import { Case, Row, Section } from "../_components/section";
import { source, type Source } from "../_lib/source";
import s from "../_components/sink.module.css";

/* Read off disk, never pasted. `?raw` is a build-time import, so the block
 * below is the file — a pasted excerpt is a copy that goes stale silently and
 * is wrong in exactly the way a showcase must not be.
 *
 * The alternative is a filesystem read behind a server function. `?raw`
 * reaches the same place with no request-time I/O, and it fails at BUILD if a
 * path is wrong rather than rendering an empty block at request time. */
import buttonSrc from "~/components/forms/button/button.tsx?raw";
import buttonVariantsSrc from "~/components/forms/button/button.variants.ts?raw";
import checkboxSrc from "~/components/forms/checkbox/checkbox.tsx?raw";
import fieldSrc from "~/components/forms/field/field.tsx?raw";
import fieldsetSrc from "~/components/forms/fieldset/fieldset.tsx?raw";
import inputSrc from "~/components/forms/input/input.tsx?raw";
import inputVariantsSrc from "~/components/forms/input/input.variants.ts?raw";
import labelSrc from "~/components/forms/label/label.tsx?raw";
import radioGroupSrc from "~/components/forms/radio-group/radio-group.tsx?raw";
import selectSrc from "~/components/forms/select/select.tsx?raw";
import switchSrc from "~/components/forms/switch/switch.tsx?raw";
import toggleSrc from "~/components/forms/toggle/toggle.tsx?raw";
import toggleVariantsSrc from "~/components/forms/toggle/toggle.variants.ts?raw";

const src = {
  button: [
    source("forms/button/button.tsx", buttonSrc),
    source("forms/button/button.variants.ts", buttonVariantsSrc),
  ],
  label: [source("forms/label/label.tsx", labelSrc)],
  input: [
    source("forms/input/input.tsx", inputSrc),
    source("forms/input/input.variants.ts", inputVariantsSrc),
  ],
  field: [source("forms/field/field.tsx", fieldSrc)],
  fieldset: [source("forms/fieldset/fieldset.tsx", fieldsetSrc)],
  checkbox: [source("forms/checkbox/checkbox.tsx", checkboxSrc)],
  switch: [source("forms/switch/switch.tsx", switchSrc)],
  toggle: [
    source("forms/toggle/toggle.tsx", toggleSrc),
    source("forms/toggle/toggle.variants.ts", toggleVariantsSrc),
  ],
  radio: [source("forms/radio-group/radio-group.tsx", radioGroupSrc)],
  select: [source("forms/select/select.tsx", selectSrc)],
} satisfies Record<string, readonly Source[]>;

const INTENTS: ButtonIntent[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: Exclude<ButtonSize, "icon">[] = ["sm", "md", "lg"];

/* A collection, not a list of children. The library needs to know the values
   before anything is open — a typeahead has to match against options that have
   never been rendered. */
const retention = createListCollection({
  items: [
    { label: "Keep for 30 days", value: "30d" },
    { label: "Keep for 1 year", value: "1y" },
    { label: "Keep indefinitely", value: "forever" },
    { label: "Delete on read", value: "burn", disabled: true },
  ],
});

export function FormsSection() {
  const [marks, setMarks] = createSignal<string[]>(["bold"]);
  const marked = (m: string) => marks().includes(m);
  const mark = (m: string) => (on: boolean) =>
    setMarks((xs) => (on ? [...xs, m] : xs.filter((x) => x !== m)));

  return (
    <Section
      id="forms"
      title="Forms"
      blurb="Ten primitives. The theme running through them is that a control's state has to be announced and not merely drawn — which is why the third checkbox state, the switch's role and the field's wiring each get an argument rather than a default."
    >
      <Case title="Button" note="intent · size · state · asChild" sources={src.button}>
        <Row label="intent">
          <For each={INTENTS}>{(intent) => <Button intent={intent}>{intent}</Button>}</For>
          <Button>default</Button>
        </Row>

        <Row label="size">
          <For each={SIZES}>{(size) => <Button size={size}>{size}</Button>}</For>
          {/* From `components/utility/icon`, the one file allowed to import
              lucide. A screen imports the wrapper, never the library — so this
              demo is also the seam being exercised. The glyph is decorative:
              the accessible name comes from the Button's own aria-label, which
              its type demands on the icon branch. */}
          <Button size="icon" aria-label="Dismiss"><X size={14} aria-hidden="true" /></Button>
          <Button size="icon" intent="primary" aria-label="Confirm"><Check size={14} aria-hidden="true" /></Button>
        </Row>

        <Row label="state">
          <Button>idle</Button>
          <Button loading>saving</Button>
          <Button disabled>disabled</Button>
          <Button intent="primary" loading>saving</Button>
          <Button intent="danger" disabled>disabled</Button>
        </Row>

        <Row label="asChild">
          <Button asChild={(props) => <A href="/" {...props()}>Home</A>} />
          <Button
            intent="primary"
            asChild={(props) => <a href="https://start.solidjs.com" {...props()}>External</a>}
          />
          <Button
            disabled
            asChild={(props) => <a id="ks-inert-link" href="/nowhere" {...props()}>Disabled link</a>}
          />
        </Row>

        <Row label="composition">
          <Button class={s.caseNote} id="ks-classed">extra class</Button>
          <Button id="ks-handler" onClick={(e) => e.currentTarget.setAttribute("data-clicked", "yes")}>
            click me
          </Button>
        </Row>

        <p class={s.caseNote}>
          <code>size="icon"</code> renders no text, so the type demands an{" "}
          <code>aria-label</code> — omitting it is a compile error, not a review comment. A
          loading button keeps its accessible name, because the indicator is a pseudo-element
          drawn from <code>data-loading</code> rather than a child that replaced the label.
        </p>
        <p class={s.caseNote}>
          <code>asChild</code> renders one element, not a button wrapping a link: the caller
          receives a function, calls it, and spreads the result, so the props cannot land on a
          wrapper by accident. A caller's <code>class</code> is composed with the variant
          classes and a caller's handler is passed through unwrapped — this primitive never
          manufactures one.
        </p>
        <p class={s.caseNote}>
          The inert link takes <code>aria-disabled</code> and <code>tabindex="-1"</code>, never
          the native <code>disabled</code> attribute, which means nothing on an anchor. It stops
          a click and stops tabbing, and it does <strong>not</strong> stop Enter after a
          programmatic focus — so the rule is about call sites:{" "}
          <strong>do not render a link you do not want followed.</strong>
        </p>
      </Case>

      <Case title="Label" note="the only labelling implementation" sources={src.label}>
        <Row label="for">
          <div class={s.stack}>
            <Label for="ks-label-demo">Operator callsign</Label>
            <Input id="ks-label-demo" placeholder="e.g. NIGHTJAR" />
          </div>
        </Row>
        <p class={s.caseNote}>
          It does not generate an id. A component that mints one has to own the control too,
          and the moment two controls belong under one label — a range, a phone number split
          across three boxes — that ownership is in the way. The id is the caller's, so{" "}
          <code>Field</code> can supply it and a hand-wired pair can supply its own.
        </p>
      </Case>

      <Case title="Input" note="size · mono · multiline · invalid" sources={src.input}>
        <Row label="size">
          <Input size="sm" aria-label="small" placeholder="sm" />
          <Input size="md" aria-label="medium" placeholder="md" />
          <Input size="lg" aria-label="large" placeholder="lg" />
        </Row>

        <Row label="mono">
          <Input mono aria-label="identifier" value="7c1f-4a02-9e33" />
          <Input aria-label="proportional" value="7c1f-4a02-9e33" />
        </Row>

        <Row label="state">
          <Input aria-label="idle" placeholder="idle" />
          <Input aria-label="invalid" aria-invalid value="not an address" />
          <Input aria-label="disabled" disabled value="locked" />
          <Input aria-label="readonly" readOnly value="read only" />
        </Row>

        <Row label="textarea">
          <Textarea aria-label="notes" rows={3} placeholder="Two elements, one variant set." />
        </Row>

        <p class={s.caseNote}>
          <code>mono</code> is not decoration. A value read back character by character — an
          id, a hostname, a token — needs tabular figures and an unambiguous 0/O, and the two
          fields above hold the same string.
        </p>
        <p class={s.caseNote}>
          Neither element invents an invalid state. <code>aria-invalid</code> arrives from
          outside, because the input does not know whether it is wrong — the form does. The
          ring above is keyed off the attribute, so the announcement and the colour cannot
          disagree.
        </p>
      </Case>

      <Case title="Field" note="label · hint · error · required" sources={src.field}>
        <Row label="anatomy">
          <Field label="Site name" hint="Shown in the header and in exports.">
            {(control) => <Input {...control} placeholder="Northgate" />}
          </Field>
        </Row>

        <Row label="required">
          <Field label="Callsign" required hint="Six characters, no spaces.">
            {(control) => <Input {...control} mono placeholder="NIGHTJAR" />}
          </Field>
        </Row>

        <Row label="error">
          <Field
            label="Contact address"
            required
            error="That address has no domain."
            hint="Used for handover notices only."
          >
            {(control) => <Input {...control} value="ops@" />}
          </Field>
        </Row>

        <Row label="textarea">
          <Field label="Handover note" hint="Markdown is not rendered.">
            {(control) => <Textarea {...control} rows={3} />}
          </Field>
        </Row>

        <p class={s.caseNote}>
          The render prop is the whole design. <code>Field</code> owns the id, the description
          ids and the invalid flag, and hands them to the caller as a props object to spread —
          it never reaches for the control. That is what lets it wrap an input, a textarea or
          a third-party widget without knowing which.
        </p>
        <p class={s.caseNote}>
          The hint is <strong>not</strong> replaced by the error. "Six characters, no spaces"
          is still true while the field is wrong, and swapping them removes the instruction at
          the exact moment it is needed. The error is announced first because it is the more
          urgent of the two.
        </p>
        <p class={s.caseNote}>
          The asterisk is <code>aria-hidden</code>. <code>required</code> on the control is the
          announcement; hearing "star" after every label is noise.
        </p>
      </Case>

      <Case title="Fieldset" note="the SET, not the control" sources={src.fieldset}>
        <Row label="grouped">
          <Fieldset
            legend="Retention"
            hint="Applies to every stream in this site."
          >
            <div class={s.stack}>
              {/* Named even though the legend above says the same words: the
                  legend names the fieldset, and this is a different element. */}
              <RadioGroup aria-label="Retention" value="1y">
                <Radio value="30d">30 days</Radio>
                <Radio value="1y">1 year</Radio>
                <Radio value="forever">Indefinitely</Radio>
              </RadioGroup>
            </div>
          </Fieldset>
        </Row>

        <Row label="error">
          <Fieldset legend="Notify on" error="Choose at least one channel.">
            <div class={s.stack}>
              <div class={s.inline}>
                <Checkbox id="ks-notify-email" /><Label for="ks-notify-email">Email</Label>
              </div>
              <div class={s.inline}>
                <Checkbox id="ks-notify-sms" /><Label for="ks-notify-sms">SMS</Label>
              </div>
            </div>
          </Fieldset>
        </Row>

        <p class={s.caseNote}>
          A legend is announced before <em>every</em> control in the set, which is the one
          thing an ordinary heading above a group does not do. Use it when the question is
          about the set — "notify on" — and not when each control stands alone.
        </p>
        <p class={s.caseNote}>
          Unlike <code>Field</code>, the wiring stays on the container: the error belongs to
          the group, so <code>aria-describedby</code> and <code>aria-invalid</code> go on the{" "}
          <code>fieldset</code> rather than being handed down to a control that is only one of
          several.
        </p>
      </Case>

      <Case title="Checkbox" note="three states" sources={src.checkbox}>
        <Row label="state">
          <div class={s.inline}>
            <Checkbox id="ks-cb-off" /><Label for="ks-cb-off">unchecked</Label>
          </div>
          <div class={s.inline}>
            <Checkbox id="ks-cb-on" checked /><Label for="ks-cb-on">checked</Label>
          </div>
          <div class={s.inline}>
            <Checkbox id="ks-cb-mixed" checked="indeterminate" />
            <Label for="ks-cb-mixed">indeterminate</Label>
          </div>
          <div class={s.inline}>
            <Checkbox id="ks-cb-disabled" disabled /><Label for="ks-cb-disabled">disabled</Label>
          </div>
        </Row>

        <p class={s.caseNote}>
          The third state is a value, not a variant — it comes from the data (a parent over a
          partly-selected list), never from an author choosing a look. Both glyphs are always
          present and <code>data-state</code> decides which shows.
        </p>
        <p class={s.caseNote}>
          It is announced as "mixed", and that took work: the control is a real{" "}
          <code>input type="checkbox"</code>, <code>indeterminate</code> is a property with no
          attribute form, and the library only syncs it when the value <em>changes</em>. A
          checkbox rendered indeterminate therefore drew the dash and announced "not checked"
          — visible and unannounced, which is the failure this whole group is arguing against.
          The component assigns the property itself.
        </p>
      </Case>

      <Case title="Switch" note="applied on press, not on save" sources={src.switch}>
        <Row label="state">
          <div class={s.inline}><Switch id="ks-sw-off" /><Label for="ks-sw-off">off</Label></div>
          <div class={s.inline}><Switch id="ks-sw-on" checked /><Label for="ks-sw-on">on</Label></div>
          <div class={s.inline}>
            <Switch id="ks-sw-disabled" disabled /><Label for="ks-sw-disabled">disabled</Label>
          </div>
          <div class={s.inline}>
            <Switch id="ks-sw-disabled-on" checked disabled />
            <Label for="ks-sw-disabled-on">disabled, on</Label>
          </div>
        </Row>

        <p class={s.caseNote}>
          A switch and a checkbox are interchangeable to look at and neither substitutes for
          the other. The test: <strong>does pressing it change anything before you press
          Save?</strong> If yes it is a switch. Getting it wrong is not cosmetic — a switch
          implies its change has already happened, so somebody navigates away believing they
          have saved.
        </p>
        <p class={s.caseNote}>
          <code>role="switch"</code> is set by this wrapper. The library renders the same bare
          checkbox input for both controls, so without it the paragraph above would be a
          comment rather than a behaviour.
        </p>
      </Case>

      <Case title="Toggle" note="a button that stays down" sources={src.toggle}>
        <Row label="pressed">
          <Toggle pressed={marked("bold")} onPressedChange={mark("bold")}>Bold</Toggle>
          <Toggle pressed={marked("italic")} onPressedChange={mark("italic")}>Italic</Toggle>
          <Toggle pressed={marked("under")} onPressedChange={mark("under")}>Underline</Toggle>
        </Row>

        <Row label="shape">
          <Toggle shape="square" pressed>square</Toggle>
          <Toggle shape="pill" pressed>pill</Toggle>
          <Toggle shape="pill">pill, up</Toggle>
        </Row>

        <Row label="size">
          <Toggle size="sm" pressed>sm</Toggle>
          <Toggle size="md" pressed>md</Toggle>
          <Toggle size="icon" aria-label="Bold"><Check size={14} aria-hidden="true" /></Toggle>
        </Row>

        <Row label="state">
          <Toggle disabled>disabled</Toggle>
          <Toggle disabled pressed>disabled, down</Toggle>
        </Row>

        <p class={s.caseNote}>
          A button carrying <code>aria-pressed</code> — a view or a mode, not data. A
          formatting mark and a filter chip are toggles; "include withdrawn invitations" beside
          a Save button is a checkbox. Nothing here is submitted.
        </p>
        <p class={s.caseNote}>
          The stylesheet keys off <code>aria-pressed</code> rather than{" "}
          <code>data-state</code>, because every primitive in this library writes{" "}
          <code>data-state</code> and the attribute collides the moment two are composed. The
          shape is not decoration either: a pill reads as one of a set of filters, a square as
          one of a set of modes.
        </p>
      </Case>

      <Case title="Radio group" note="one tab stop, arrow keys inside" sources={src.radio}>
        <Row label="options">
          <RadioGroup aria-label="Retention" value="1y">
            <Radio value="30d">30 days</Radio>
            <Radio value="1y">1 year</Radio>
            <Radio value="forever">Indefinitely</Radio>
          </RadioGroup>
        </Row>

        <Row label="horizontal">
          <RadioGroup aria-label="Priority" orientation="horizontal" value="b">
            <Radio value="a">Low</Radio>
            <Radio value="b">Normal</Radio>
            <Radio value="c">High</Radio>
          </RadioGroup>
        </Row>

        <Row label="disabled">
          <RadioGroup aria-label="Plan" value="a">
            <Radio value="a">Available</Radio>
            <Radio value="b" disabled>Requires an upgrade</Radio>
          </RadioGroup>
        </Row>

        <p class={s.caseNote}>
          The group is one tab stop and the arrow keys move within it — which is why a set of
          radios is not a set of checkboxes with a shared name. Tabbing through five options
          to reach the next field is the behaviour this avoids.
        </p>
        <p class={s.caseNote}>
          Each option's words are inside its <code>label</code>, so the whole phrase is the hit
          target. A 15px circle is not one.
        </p>
        <p class={s.caseNote}>
          The groups above are named with <code>aria-label</code>, and that is worth spelling
          out because the obvious alternative does not do it: a{" "}
          <code>Fieldset</code> legend names the <strong>fieldset</strong>, which is a
          different element from the <code>radiogroup</code> inside it — measured, the group
          itself stays unnamed. Wrapping one in a fieldset is still right for a real form,
          since the legend is announced on entry; it is not a substitute for the group having
          a name of its own.
        </p>
      </Case>

      <Case title="Select" note="a value, not a menu" sources={src.select}>
        <Row label="closed">
          <div class={s.stack}>
            <Select collection={retention} value={["1y"]}>
              <SelectLabel>Retention</SelectLabel>
              <SelectTrigger><SelectValue placeholder="Choose a policy" /></SelectTrigger>
              <SelectContent>
                <For each={retention.items}>
                  {(item) => <SelectItem item={item}>{item.label}</SelectItem>}
                </For>
              </SelectContent>
              <SelectHiddenSelect />
            </Select>
          </div>
        </Row>

        <Row label="empty">
          <div class={s.stack}>
            <Select collection={retention}>
              <SelectLabel>Retention</SelectLabel>
              <SelectTrigger><SelectValue placeholder="Choose a policy" /></SelectTrigger>
              <SelectContent>
                <For each={retention.items}>
                  {(item) => <SelectItem item={item}>{item.label}</SelectItem>}
                </For>
              </SelectContent>
              <SelectHiddenSelect />
            </Select>
          </div>
        </Row>

        <p class={s.caseNote}>
          A select holds a <strong>value</strong>; a menu performs an <strong>action</strong>.
          They look alike and are announced differently, and the wrong one leaves a user
          waiting for a change that a menu already made. "Delete on read" above is disabled
          rather than absent, so the option is known to exist and known to be unavailable.
        </p>
        <p class={s.caseNote}>
          The options are a <code>collection</code> rather than children, because typeahead has
          to match against options that have never been rendered. The list is portalled so an{" "}
          <code>overflow: hidden</code> ancestor cannot clip it — the commonest way a select
          becomes unusable inside a scrolling panel, and one no z-index fixes.
        </p>
        <p class={s.caseNote}>
          The label comes from the library's own part, wearing <code>Label</code>'s look via{" "}
          <code>asChild</code>. The trigger's id is generated, so an outside{" "}
          <code>&lt;label for&gt;</code> would have nothing to point at — and{" "}
          <code>SelectHiddenSelect</code> is what makes the whole thing submit; without it this
          is a styled div holding a value in memory.
        </p>
      </Case>
    </Section>
  );
}
