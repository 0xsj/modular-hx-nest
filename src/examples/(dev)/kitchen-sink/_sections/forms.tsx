import { A as Link } from "@solidjs/router";
import { Button, Field, Fieldset, Input, Textarea } from "~/components/forms";
import { Plus, Trash2 } from "~/components/utility";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { readSources } from "../_lib/source";
import { SliderCase } from "./additional-controls";
import { ChoicesCases } from "./choices-case";

/* One case per COMPONENT, not per variant. The rail is derived from the cases,
   so a case named "Intents" puts a variant in the menu where the component
   should be — you cannot find Button by looking for Button.

   This section is also a SERVER component and passes no handler, which is the
   point: a Button that manufactured one could not render here at all. */
export function FormsSection() {
  const sources = readSources([
    "forms/field/field.tsx",
    "forms/button/button.tsx",
    "forms/button/button.variants.ts",
    "forms/button/button.module.css",
  ]);
  const fieldSources = readSources([
    "forms/field/field.tsx",
    "forms/input/input.tsx",
  ]);
  return (
    <Section
      id="forms"
      title="Forms"
      blurb="Button first. It borrows one thing from the headless library — the composition slot — because the platform element is already focusable, keyboard-operable and self-announcing; everything else it needs is an attribute."
    >
      <Case
        title="Button"
        note="intent · size · state · asChild"
        sources={sources}
      >
        <Row label="intent">
          <Button intent="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button intent="ghost">Ghost</Button>
          <Button intent="danger">Danger</Button>
          <Button intent="link">Link</Button>
        </Row>

        <Row label="size">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus size={14} />
          </Button>
          <Button size="icon" intent="danger" aria-label="Delete">
            <Trash2 size={14} />
          </Button>
        </Row>

        {/* No icon slot, deliberately: a caller placing an icon among the
            children already works, so a prop for it would be API for nothing. */}
        <Row label="icon + label">
          <Button intent="primary">
            <Plus size={14} aria-hidden="true" />
            Add target
          </Button>
          <Button intent="danger">
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        </Row>

        <Row label="disabled">
          <Button disabled>Disabled</Button>
          <Button intent="primary" disabled>
            Disabled
          </Button>
        </Row>

        <Row label="loading">
          <Button loading>Saving</Button>
          <Button intent="primary" loading>
            Saving
          </Button>
        </Row>

        <Row label="asChild">
          <Button
            asChild={(forwarded) => (
              <Link {...forwarded()} href="#button">
                A link wearing the button
              </Link>
            )}
          />
          <Button
            asChild={(forwarded) => (
              <Link {...forwarded()} href="#button">
                Inert link
              </Link>
            )}
            disabled
          />
        </Row>

        <p class={s.limits}>
          <strong>Loading keeps the label</strong> rather than replacing it —
          swapping the text moves the control under a reader&rsquo;s cursor. The
          indicator is hidden from assistive technology; <code>aria-busy</code>{" "}
          is the announcement.
          <br />
          <br />
          <strong>The two inert branches differ.</strong> On the native element{" "}
          <code>disabled</code> does the whole job. On an arbitrary element it
          means nothing and cannot be removed, so the mitigation is{" "}
          <code>aria-disabled</code>, removal from the tab order, and suppressed
          pointer events. That stops a click and stops tabbing to it. It does{" "}
          <strong>not</strong> stop keyboard activation if something focuses the
          element programmatically — closing that gap needs a synthesised
          handler, which is forbidden. The rule is: do not render a link you do
          not want followed.
        </p>
      </Case>

      <Case
        title="Inputs and fields"
        note="Field owns the label, hint and error · Fieldset does the same for a group"
        sources={fieldSources}
      >
        <Row label="a field">
          <div class={s.fieldGrid}>
            <Field label="Name">
              {(c) => <Input {...c} placeholder="api" />}
            </Field>
            <Field label="Host" hint="A hostname, not a URL." required>
              {(c) => <Input {...c} placeholder="api.example.com" />}
            </Field>
            <Field label="Host" error="That is not a hostname." required>
              {(c) => <Input {...c} value="not a host" />}
            </Field>
            <Field
              label="Host"
              hint="A hostname, not a URL."
              error="That is not a hostname."
            >
              {(c) => <Input {...c} value="!!" />}
            </Field>
          </div>
        </Row>

        <Row label="text controls">
          <div class={s.fieldGrid}>
            <Field label="Notes" hint="Markdown is not rendered.">
              {(c) => <Textarea {...c} placeholder="Anything worth saying" />}
            </Field>
            <Field label="Identifier" hint="Assigned when it was created.">
              {(c) => <Input {...c} mono readOnly value="itm_8f2a41c9" />}
            </Field>
            <Field label="Identifier">
              {(c) => <Input {...c} mono disabled value="itm_8f2a41c9" />}
            </Field>
          </div>
        </Row>

        <Row label="a group">
          <div class={s.fieldGrid}>
            <Fieldset legend="Notify me" hint="You can change this later.">
              <label class={s.choice}>
                <input type="radio" name="n" checked /> By email
              </label>
              <label class={s.choice}>
                <input type="radio" name="n" /> By SMS
              </label>
              <label class={s.choice}>
                <input type="radio" name="n" /> Not at all
              </label>
            </Fieldset>
            <Fieldset legend="Notify me" error="Pick one.">
              <label class={s.choice}>
                <input type="radio" name="m" /> By email
              </label>
              <label class={s.choice}>
                <input type="radio" name="m" /> By SMS
              </label>
            </Fieldset>
          </div>
        </Row>

        <p class={s.limits}>
          <strong>The children of a Field are a function</strong>, called with
          exactly the attributes the control must carry — <code>id</code>,{" "}
          <code>aria-describedby</code>, <code>aria-invalid</code>,{" "}
          <code>required</code> — so there is nothing to render without
          receiving them. A Field taking a node would have to reach into the
          child to wire it, which works until somebody nests the control one
          level deeper and then fails silently.
        </p>

        <p class={s.limits}>
          <strong>A group keeps its wiring instead of handing it down.</strong>{" "}
          A description applying to one radio of four would be wrong three
          times, so it stays on the <code>&lt;fieldset&gt;</code> — which is why
          Fieldset takes plain children rather than a function. The{" "}
          <code>&lt;legend&gt;</code> is announced before <em>every</em> control
          inside the group; a styled paragraph above it reads as unrelated text.
        </p>

        <p class={s.limits}>
          <strong>Read-only is not disabled.</strong> A read-only value is
          selectable, copyable and in the tab order; a disabled control is out
          of play. Rendering them alike teaches people that greyed-out text
          cannot be copied. And with both a hint and an error,{" "}
          <code>aria-describedby</code> names the error first, because a reader
          announces them in that order.
        </p>
      </Case>

      <ChoicesCases />
      <SliderCase />

      <p class={s.limits}>
        Rendering a <em>failure</em> in a form — per-field messages from a
        refused write — is under{" "}
        <Link href="/kitchen-sink/data" class={s.anchor}>
          Data and failures
        </Link>
        , with the rest of the cases where the transport tier&rsquo;s vocabulary
        meets a component.
      </p>
    </Section>
  );
}
