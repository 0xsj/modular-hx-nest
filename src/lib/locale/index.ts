import { err, invalid, ok, type Result } from "../kernel";

export type LocaleContext = {
  locale: string;
  timeZone: string;
  currency: string;
};
export type Formatters = {
  context: LocaleContext;
  number(value: number): Result<string>;
  money(value: number): Result<string>;
  instant(epochMs: number): Result<string>;
};
const bad = (message: string) =>
  err(invalid(message, {}, { type: "format_invalid" }));
export function createFormatters(context: LocaleContext): Result<Formatters> {
  try {
    if (
      !context.locale ||
      !context.timeZone ||
      !/^[A-Z]{3}$/.test(context.currency) ||
      Intl.NumberFormat.supportedLocalesOf([context.locale]).length !== 1
    )
      return bad(
        "Choose a supported locale, time zone and three-letter currency.",
      );
    const number = new Intl.NumberFormat(context.locale);
    const money = new Intl.NumberFormat(context.locale, {
      style: "currency",
      currency: context.currency,
    });
    const date = new Intl.DateTimeFormat(context.locale, {
      timeZone: context.timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    });
    return ok({
      context: { ...context },
      number: (value) =>
        Number.isFinite(value)
          ? ok(number.format(value))
          : bad("A finite number is required."),
      money: (value) =>
        Number.isFinite(value)
          ? ok(money.format(value))
          : bad("A finite monetary amount is required."),
      instant: (value) =>
        Number.isFinite(value) && Number.isFinite(new Date(value).getTime())
          ? ok(date.format(value))
          : bad("A valid instant is required."),
    });
  } catch {
    return bad("The formatting context is invalid.");
  }
}
