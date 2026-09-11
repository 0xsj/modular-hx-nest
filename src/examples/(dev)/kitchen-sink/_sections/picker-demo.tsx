import { createSignal } from "solid-js";
import type { ChoiceOption } from "~/components/forms";
import {
  Button,
  Combobox,
  DatePicker,
  DateRangePicker,
  MultiSelect,
  type DateRange,
} from "~/components/forms";
import { Text } from "~/components/typography";
import s from "../_components/sink.module.css";
const PEOPLE: readonly ChoiceOption[] = [
  {
    value: "ada",
    label: "Ada Lovelace",
    description: "Platform engineering",
  },
  {
    value: "grace",
    label: "Grace Hopper",
    description: "Developer experience",
  },
  {
    value: "margaret",
    label: "Margaret Hamilton",
    description: "Reliability",
  },
  {
    value: "katherine",
    label: "Katherine Johnson",
    description: "Research",
  },
  {
    value: "alan",
    label: "Alan Turing",
    description: "Unavailable for assignment",
    disabled: true,
  },
];
const TOPICS: readonly ChoiceOption[] = [
  {
    value: "design",
    label: "Design systems",
  },
  {
    value: "platform",
    label: "Platform",
  },
  {
    value: "research",
    label: "Research",
  },
  {
    value: "accessibility",
    label: "Accessibility",
  },
  {
    value: "observability",
    label: "Observability",
  },
  {
    value: "security",
    label: "Security and identity",
  },
];
const INITIAL_RANGE = {
  start: "2026-09-10",
  end: "2026-09-14",
};
export function ComboboxDemo() {
  const [owner, setOwner] = createSignal<string | null>("ada");
  return (
    <div class={s.controlExample}>
      <Combobox
        label="Project owner"
        options={PEOPLE}
        value={owner()}
        onValueChange={setOwner}
        hint="Search by name. Arrow keys explore; Enter selects."
      />
      <Text size="sm" tone="muted">
        Selected ID: <output>{owner() ?? "None"}</output>
      </Text>
      <Combobox
        label="Reviewer"
        options={PEOPLE}
        placeholder="Find a reviewer…"
        hint="An uncontrolled, optional choice."
      />
    </div>
  );
}
export function MultiSelectDemo() {
  const [topics, setTopics] = createSignal<string[]>([
    "design",
    "accessibility",
  ]);
  return (
    <div class={s.controlExample}>
      <MultiSelect
        label="Project topics"
        options={TOPICS}
        value={topics()}
        onValueChange={setTopics}
        hint="Search to add topics. Selected topics remain below the input."
      />
      <Text size="sm" tone="muted">
        Selected IDs: <output>{topics().join(", ") || "None"}</output>
      </Text>
    </div>
  );
}
export function DatePickerDemo() {
  const [date, setDate] = createSignal<string | null>("2026-09-10");
  return (
    <div class={s.controlExample}>
      <DatePicker
        label="Due date"
        value={date()}
        onValueChange={setDate}
        hint="Type a date or open the calendar. Stored as a date without a time zone."
      />
      <Text size="sm" tone="muted">
        Selected date: <output>{date() ?? "None"}</output>
      </Text>
      <DatePicker
        label="US date format"
        locale="en-US"
        defaultValue="2026-09-10"
        hint="Same date value; month appears before day."
      />
    </div>
  );
}
export function DateRangePickerDemo() {
  const [range, setRange] = createSignal<DateRange | null>(INITIAL_RANGE);
  return (
    <div class={s.controlExample}>
      <DateRangePicker
        label="Reporting period"
        value={range()}
        onValueChange={setRange}
        hint="Both endpoints are inclusive. Choose a start, then an end."
      />
      <Text size="sm" tone="muted">
        Selected range:{" "}
        <output>
          {(() => {
            const _rangeSnapshot = range();
            return _rangeSnapshot
              ? `${_rangeSnapshot.start} → ${_rangeSnapshot.end}`
              : "None";
          })()}
        </output>
      </Text>
    </div>
  );
}
export function PickerStatesDemo() {
  return (
    <div class={s.fieldGrid}>
      <Combobox
        label="Disabled owner"
        options={PEOPLE}
        defaultValue="ada"
        disabled
      />
      <Combobox
        label="Read-only owner"
        options={PEOPLE}
        value="grace"
        readOnly
      />
      <MultiSelect
        label="Disabled topics"
        options={TOPICS}
        defaultValue={["design", "platform"]}
        disabled
      />
      <MultiSelect
        label="Read-only topics"
        options={TOPICS}
        value={["accessibility", "research"]}
        readOnly
      />
      <DatePicker label="Disabled date" defaultValue="2026-09-10" disabled />
      <DatePicker label="Read-only date" value="2026-09-10" readOnly />
      <DateRangePicker
        label="Disabled period"
        defaultValue={INITIAL_RANGE}
        disabled
      />
      <DateRangePicker
        label="Read-only period"
        value={INITIAL_RANGE}
        readOnly
      />
    </div>
  );
}
export function PickerValidationDemo() {
  const [booking, setBooking] = createSignal<DateRange | null>({
    start: "2026-09-10",
    end: "2026-09-12",
  });
  return (
    <div class={s.fieldGrid}>
      <Combobox
        label="Required owner"
        options={PEOPLE}
        required
        error="Choose an owner before continuing."
        hint="Unavailable people cannot be assigned."
      />
      <MultiSelect
        label="Required topics"
        options={TOPICS}
        required
        error="Choose at least one topic."
      />
      <DatePicker
        label="September appointment"
        defaultValue="2026-09-10"
        minDate="2026-09-01"
        maxDate="2026-09-30"
        isDateUnavailable={(date) =>
          date === "2026-09-18" || date === "2026-09-19"
        }
        hint="September only. The 18th and 19th are unavailable."
      />
      <div class={s.controlExample}>
        <DateRangePicker
          label="Booking window"
          value={booking()}
          onValueChange={setBooking}
          minDate="2026-09-01"
          maxDate="2026-09-30"
          isDateUnavailable={(date) => date === "2026-09-18"}
          hint="A booking cannot cross the unavailable 18th."
        />
        <Text size="sm" tone="muted">
          Selected booking:{" "}
          <output aria-label="Selected booking">
            {(() => {
              const _bookingSnapshot = booking();
              return _bookingSnapshot
                ? `${_bookingSnapshot.start} → ${_bookingSnapshot.end}`
                : "None";
            })()}
          </output>
        </Text>
      </div>
      <DatePicker
        label="Date needs correction"
        defaultValue="2026-09-10"
        required
        error="This deadline needs confirmation."
        hint="Your entered date is preserved."
      />
      <DateRangePicker
        label="Period needs correction"
        defaultValue={INITIAL_RANGE}
        error="This period overlaps an existing report."
      />
    </div>
  );
}
export function EmptyChoicesDemo() {
  return (
    <div class={s.fieldGrid}>
      <Combobox label="No available owners" options={[]} />
      <MultiSelect label="No available topics" options={[]} />
      <Combobox
        label="Search without a match"
        options={PEOPLE}
        hint="Type a name outside this list to see the no-match state."
      />
      <DatePicker label="Optional date" />
      <DateRangePicker label="Optional period" />
    </div>
  );
}
export function PickerFormDemo() {
  const [submitted, setSubmitted] = createSignal<[string, string][]>([]);
  return (
    <form
      class={s.controlExample}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(
          Array.from(new FormData(event.currentTarget), ([name, value]) => [
            name,
            String(value),
          ]),
        );
      }}
      onReset={() => setSubmitted([])}
    >
      <Combobox
        label="Form owner"
        name="owner"
        options={PEOPLE}
        defaultValue="ada"
        required
      />
      <MultiSelect
        label="Form topics"
        name="topic"
        options={TOPICS}
        defaultValue={["design", "platform"]}
      />
      <DatePicker
        label="Form due date"
        name="dueDate"
        defaultValue="2026-09-10"
      />
      <DateRangePicker
        label="Form period"
        startName="startDate"
        endName="endDate"
        defaultValue={INITIAL_RANGE}
      />
      <div class={s.row}>
        <Button type="submit" intent="primary">
          Inspect submitted values
        </Button>
        <Button type="reset">Reset form</Button>
      </div>
      <Text size="sm" tone="muted">
        This example reads FormData locally. Reset restores each uncontrolled
        default.
      </Text>
      {(() => {
        const _submittedSnapshot = submitted();
        return _submittedSnapshot.length > 0 ? (
          <pre aria-label="Submitted picker values" class={s.code}>
            {_submittedSnapshot
              .map(([name, value]) => `${name}: ${value}`)
              .join("\n")}
          </pre>
        ) : null;
      })()}
    </form>
  );
}
