/** Undefined rejects a present value; omission is handled by the schema. */
export type QueryCodec<T> = {
  readonly defaultValue: T;
  readonly expected: string;
  parse(raw: string): T | undefined;
  format(value: T): string | undefined;
};

export function textParam(
  options: { default?: string; maxLength?: number } = {},
): QueryCodec<string> {
  const max = options.maxLength ?? 200;
  const fallback = options.default ?? "";
  if (
    !Number.isSafeInteger(max) ||
    max < 1 ||
    typeof fallback !== "string" ||
    fallback.trim() !== fallback ||
    fallback.length > max
  )
    throw new Error("Invalid text query codec configuration.");
  const text = (value: string) =>
    typeof value === "string" && value.trim().length <= max
      ? value.trim()
      : undefined;
  return Object.freeze({
    defaultValue: fallback,
    expected: `text of at most ${max} characters`,
    parse: text,
    format: text,
  });
}

export function choiceParam<const T extends string>(
  values: readonly T[],
  fallback: T,
): QueryCodec<T> {
  const choices = new Set(values);
  if (
    !values.length ||
    values.some((value) => typeof value !== "string") ||
    !choices.has(fallback)
  )
    throw new Error("Invalid choice query codec configuration.");
  const choice = (value: string) =>
    choices.has(value as T) ? (value as T) : undefined;
  return Object.freeze({
    defaultValue: fallback,
    expected: "a supported choice",
    parse: choice,
    format: choice,
  });
}

export function integerParam(
  options: { default?: number; min?: number; max?: number } = {},
): QueryCodec<number> {
  const min = options.min ?? 1;
  const max = options.max ?? 10000;
  const fallback = options.default ?? min;
  const valid = (value: number) =>
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= min &&
    value <= max;
  if (
    !Number.isSafeInteger(min) ||
    min < 1 ||
    !Number.isSafeInteger(max) ||
    max < min ||
    !valid(fallback)
  )
    throw new Error("Invalid integer query codec configuration.");
  return Object.freeze({
    defaultValue: fallback,
    expected: `a whole number from ${min} to ${max}`,
    parse(raw: string) {
      if (!/^\d+$/.test(raw)) return undefined;
      const value = Number(raw);
      return valid(value) ? value : undefined;
    },
    format(value: number) {
      return valid(value) ? String(value) : undefined;
    },
  });
}
