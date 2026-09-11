import { describe, expect, it } from "vitest";
import {
  calendarDate,
  calendarRange,
  dateConstraints,
  rangeAvailabilityError,
} from "./date-value";

describe("calendar date boundary", () => {
  it("preserves dates across leap days, DST boundaries, and year changes", () => {
    for (const date of [
      "2024-02-29",
      "2026-03-08",
      "2026-11-01",
      "2026-12-31",
      "2027-01-01",
    ]) {
      expect(calendarDate(date).toString()).toBe(date);
    }
    expect(calendarDate("2024-02-29").add({ days: 1 }).toString()).toBe(
      "2024-03-01",
    );
    expect(calendarDate("2026-12-31").add({ days: 1 }).toString()).toBe(
      "2027-01-01",
    );
  });
  it("rejects timestamps, malformed dates, and impossible dates", () => {
    for (const date of [
      "2026-2-01",
      "2026-02-29",
      "2026-04-31",
      "2026-00-10",
      "2026-01-00",
      "2026-09-10T00:00:00Z",
      "",
    ]) {
      expect(() => calendarDate(date)).toThrow();
    }
  });
  it("preserves same-day and reversed endpoints for field validation", () => {
    const range = calendarRange({ start: "2026-09-10", end: "2026-09-10" });
    expect(range.start.compare(range.end)).toBe(0);
    expect(
      calendarRange({
        start: "2026-09-11",
        end: "2026-09-10",
      }).start.toString(),
    ).toBe("2026-09-11");
  });
  it("validates unavailable interior days including leap days without overrunning the last supported date", () => {
    expect(
      rangeAvailabilityError(
        calendarRange({ start: "2024-02-28", end: "2024-03-01" }),
        (date) => date === "2024-02-29",
      ),
    ).toBe("The range includes unavailable dates.");
    expect(
      rangeAvailabilityError(
        calendarRange({ start: "9999-12-31", end: "9999-12-31" }),
        () => false,
      ),
    ).toBeNull();
  });
  it("passes unavailable dates as strings and rejects reversed bounds", () => {
    const constraints = dateConstraints({
      label: "Date",
      minDate: "2026-09-01",
      maxDate: "2026-09-30",
      isDateUnavailable: (date) => date === "2026-09-18",
    });
    expect(constraints.isDateUnavailable?.(calendarDate("2026-09-18"))).toBe(
      true,
    );
    expect(constraints.isDateUnavailable?.(calendarDate("2026-09-19"))).toBe(
      false,
    );
    expect(() =>
      dateConstraints({
        label: "Date",
        minDate: "2026-10-01",
        maxDate: "2026-09-30",
      }),
    ).toThrow();
  });
});
