/**
 * Presentation contract
 * =====================
 * Formatting context explicitly supplies locale, time zone and currency.
 * Construction validates them and returns Result; invalid values must not
 * silently fall back to the machine's locale/time zone. Number, money and
 * instant formatters share this context. Nonfinite numbers and invalid Dates
 * return invalid, never "NaN", fabricated zero or an Invalid Date string.
 * Missing values stay missing at the caller. Currency is presentation only:
 * no conversion or financial arithmetic. Inputs are major currency units.
 * Instants are epoch milliseconds; a calendar date is a different domain and
 * must not be coerced through UTC midnight. Locale direction comes from the
 * caller's supported language catalog, not guessed from every possible tag.
 *
 * Cookbook uses the same fixed instant on server and client, switches locale,
 * time zone and currency, and demonstrates long German text, Arabic RTL,
 * logical spacing, isolated LTR identifiers and a direction-aware dialog.
 * Formatting output may differ in punctuation with ICU versions; tests assert
 * meaningful parts, numeric/date behavior and failures, not entire snapshots.
 * Written before implementation; tests are ordinary implementation-visible.
 */
export {};
