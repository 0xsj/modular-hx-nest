import { err, internal, ok, type Fails, type Result } from "../kernel";
import type { DiagnosticTrace } from "../diagnostics";

/** Undefined rejects the response. Readers also project wire data into a DTO. */
export type ResponseReader<T> = (value: unknown) => T | undefined;
export type ResponseDecoder<T> = (
  value: unknown,
  trace?: DiagnosticTrace,
) => Result<T, Fails<"internal">>;

export function responseDecoder<T>(
  contract: string,
  read: ResponseReader<T>,
): ResponseDecoder<T> {
  const decode = (value: unknown): Result<T, Fails<"internal">> => {
    try {
      const decoded = read(value);
      if (decoded !== undefined) return ok(decoded);
    } catch {
      // Neither a payload nor a reader's exception belongs in a public Failure.
    }
    return err(
      internal(`The response did not match the ${contract} contract.`, {
        type: "invalid_response",
      }),
    );
  };
  return (value, trace) =>
    trace ? trace.runSync("decode", () => decode(value)) : decode(value);
}

export function responseObject(
  value: unknown,
): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export const responseText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const responseTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  Number.isFinite(Date.parse(value));

export function responseArray<T>(read: ResponseReader<T>): ResponseReader<T[]> {
  return (value) => {
    if (!Array.isArray(value)) return undefined;
    const items: T[] = [];
    // for..of also visits holes, which Array.every/map would silently skip.
    for (const raw of value) {
      const item = read(raw);
      if (item === undefined) return undefined;
      items.push(item);
    }
    return items;
  };
}
