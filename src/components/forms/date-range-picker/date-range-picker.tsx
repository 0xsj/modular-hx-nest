import type { DateRangePickerProps } from "~/components/forms/date-picker/date-picker";
import { CalendarField } from "../date-picker/date-picker";
export type { DateRangePickerProps } from "../date-picker/date-picker";
export type { DateRange } from "../date-picker/date-value";
export function DateRangePicker(props: DateRangePickerProps) {
  return <CalendarField {...props} range={true} />;
}
