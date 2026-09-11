import { parseDate } from "@internationalized/date";
import type { PickerFieldProps } from "../_shared/picker-field";

export type DateRange = { start: string; end: string };
export type DateControlProps = PickerFieldProps & {
  /** Display locale; values remain Gregorian YYYY-MM-DD. */
  locale?: string;
  minDate?: string;
  maxDate?: string;
  isDateUnavailable?: (date: string) => boolean;
};

/** Deliberately never goes through Date, UTC midnight, or toISOString. */
export function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError(`Expected YYYY-MM-DD, received ${value}`);
  return parseDate(value);
}
export function calendarRange(value: DateRange) {
  // A reversed typed range is editable form state, not a malformed date.
  // Let the field's validation explain it instead of throwing on rerender.
  return { start: calendarDate(value.start), end: calendarDate(value.end) };
}

/** The calendar blocks gaps; typed endpoints also need the interior checked. */
export function rangeAvailabilityError(
  range: ReturnType<typeof calendarRange>,
  isDateUnavailable?: DateControlProps["isDateUnavailable"],
) {
  if (!isDateUnavailable || range.start.compare(range.end) > 0) return null;
  let date = range.start;
  for (;;) {
    if (isDateUnavailable(date.toString()))
      return "The range includes unavailable dates.";
    if (date.compare(range.end) >= 0) return null;
    date = date.add({ days: 1 });
  }
}
export function dateConstraints({
  minDate,
  maxDate,
  isDateUnavailable,
}: DateControlProps) {
  const minValue = minDate ? calendarDate(minDate) : undefined;
  const maxValue = maxDate ? calendarDate(maxDate) : undefined;
  if (minValue && maxValue && minValue.compare(maxValue) > 0)
    throw new RangeError("Minimum date must not follow maximum date.");
  return {
    minValue,
    maxValue,
    isDateUnavailable: isDateUnavailable
      ? (date: { toString(): string }) => isDateUnavailable(date.toString())
      : undefined,
  };
}
