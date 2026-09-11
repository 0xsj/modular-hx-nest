import { describe, expect, it } from "vitest";
import { createFormatters } from ".";
const context = { locale: "en-US", timeZone: "UTC", currency: "USD" };
describe("explicit presentation context (implementation-visible)", () => {
  it.each([
    { locale: "bad_tag" },
    { locale: "zz-ZZ" },
    { locale: "" },
    { timeZone: "Mars/Olympus" },
    { timeZone: "" },
    { currency: "usd" },
    { currency: "" },
  ])("rejects invalid context %s", (patch) => {
    expect(createFormatters({ ...context, ...patch }).ok).toBe(false);
  });
  it("formats number separators and minor units for the chosen locale/currency", () => {
    const de = createFormatters({
      ...context,
      locale: "de-DE",
      currency: "EUR",
    }).unwrapOr(null)!;
    expect(de.number(1234.5).unwrapOr("")).toBe("1.234,5");
    expect(de.money(1234.5).unwrapOr("")).toContain("1.234,50");
    const jp = createFormatters({ ...context, currency: "JPY" }).unwrapOr(
      null,
    )!;
    expect(jp.money(1234.5).unwrapOr("")).toContain("1,235");
  });
  it("uses the chosen time zone across a calendar-day boundary and never the machine default", () => {
    const instant = Date.UTC(2026, 8, 10, 0, 30);
    const utc = createFormatters(context).unwrapOr(null)!;
    const ny = createFormatters({
      ...context,
      timeZone: "America/New_York",
    }).unwrapOr(null)!;
    expect(utc.instant(instant).unwrapOr("")).toContain("Sep 10, 2026");
    expect(ny.instant(instant).unwrapOr("")).toContain("Sep 9, 2026");
  });
  it("distinguishes zero from invalid values and isolates a context from caller mutation", () => {
    const input = { ...context },
      formatter = createFormatters(input).unwrapOr(null)!;
    input.timeZone = "Asia/Tokyo";
    expect(formatter.context.timeZone).toBe("UTC");
    expect(formatter.number(0).unwrapOr("wrong")).toBe("0");
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(formatter.number(value).ok).toBe(false);
      expect(formatter.money(value).ok).toBe(false);
      expect(formatter.instant(value).ok).toBe(false);
    }
    expect(formatter.instant(1e30).ok).toBe(false);
  });
});
