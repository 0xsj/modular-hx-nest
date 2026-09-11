import { Case, Section } from "../_components/section";
import { readSources } from "../_lib/source";
import {
  ComboboxDemo,
  DatePickerDemo,
  DateRangePickerDemo,
  EmptyChoicesDemo,
  MultiSelectDemo,
  PickerFormDemo,
  PickerStatesDemo,
  PickerValidationDemo,
} from "./picker-demo";
export function PickersSection() {
  const [choices, multi, dates, ranges] = [
    readSources(["forms/combobox/combobox.tsx", "forms/combobox/doc.ts"]),
    readSources([
      "forms/multi-select/multi-select.tsx",
      "forms/combobox/combobox.tsx",
    ]),
    readSources([
      "forms/date-picker/date-picker.tsx",
      "forms/date-picker/date-value.ts",
    ]),
    readSources([
      "forms/date-range-picker/date-range-picker.tsx",
      "forms/date-picker/doc.ts",
    ]),
  ];
  return (
    <Section
      id="pickers"
      title="Pickers"
      blurb="Searchable choices and calendar dates, with labelled fields, keyboard interaction, and ordinary form values. Each example uses local, illustrative data."
    >
      <Case
        title="Combobox"
        note="one selected ID; search text is temporary"
        sources={choices}
      >
        <ComboboxDemo />
      </Case>
      <Case
        title="MultiSelect"
        note="selected values remain visible while searching"
        sources={multi}
      >
        <MultiSelectDemo />
      </Case>
      <Case
        title="DatePicker"
        note="calendar dates with typed segments and a calendar"
        sources={dates}
      >
        <DatePickerDemo />
      </Case>
      <Case
        title="DateRangePicker"
        note="a complete, inclusive start and end"
        sources={ranges}
      >
        <DateRangePickerDemo />
      </Case>
      <Case
        title="Disabled and read-only"
        note="unavailable controls and readable locked values"
      >
        <PickerStatesDemo />
      </Case>
      <Case
        title="Validation and constraints"
        note="required values, bounds, unavailable dates, and retained input"
      >
        <PickerValidationDemo />
      </Case>
      <Case
        title="Empty and optional"
        note="empty options, no match, and unselected dates"
      >
        <EmptyChoicesDemo />
      </Case>
      <Case
        title="Form submission and reset"
        note="IDs, repeated keys, and date strings"
      >
        <PickerFormDemo />
      </Case>
    </Section>
  );
}
