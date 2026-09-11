import { err, invalid, ok, type Fails, type Result } from "../kernel";
import type { QueryCodec } from "./codec";

type Shape = Record<string, QueryCodec<string | number>>;
export type QueryState<S extends Shape> = {
  [K in keyof S]: S[K] extends QueryCodec<infer T> ? T : never;
};
export type QueryIssue = Readonly<{ key: string; message: string }>;
export type QueryRead<T> = { value: T; issues: readonly QueryIssue[] };
export type QuerySchema<T> = {
  readonly defaults: T;
  read: (query: URLSearchParams | string) => QueryRead<T>;
  write: (
    value: T,
    base?: URLSearchParams | string,
  ) => Result<URLSearchParams, Fails<"invalid">>;
  update: (
    query: URLSearchParams | string,
    change: (current: T) => T,
  ) => Result<URLSearchParams, Fails<"invalid">>;
};

export function querySchema<const S extends Shape>(
  shape: S,
): QuerySchema<QueryState<S>> {
  type State = QueryState<S>;
  const entries = Object.entries(shape);
  for (const [key, codec] of entries) {
    const encoded = codec.format(codec.defaultValue);
    if (
      !key ||
      encoded === undefined ||
      codec.parse(encoded) !== codec.defaultValue
    )
      throw new Error(
        "Query schema defaults must round-trip through their codecs.",
      );
  }
  const defaults = Object.freeze(
    Object.fromEntries(
      entries.map(([key, codec]) => [key, codec.defaultValue]),
    ),
  ) as State;
  const issue = (key: string, codec: Shape[string]) =>
    `${key} must be ${codec.expected}; its default is being used.`;

  const read = (query: URLSearchParams | string): QueryRead<State> => {
    const params = new URLSearchParams(query);
    const values: Record<string, unknown> = Object.create(null);
    const issues: QueryIssue[] = [];
    for (const [key, codec] of entries) {
      const raw = params.getAll(key);
      if (!raw.length) {
        values[key] = codec.defaultValue;
        continue;
      }
      let decoded: unknown;
      try {
        decoded = raw.length === 1 ? codec.parse(raw[0]) : undefined;
      } catch {
        /* A custom codec's refusal uses the same explicit default path. */
      }
      if (decoded === undefined)
        issues.push({ key, message: issue(key, codec) });
      values[key] = decoded === undefined ? codec.defaultValue : decoded;
    }
    return { value: values as State, issues };
  };

  const write = (
    value: State,
    base: URLSearchParams | string = "",
  ): Result<URLSearchParams, Fails<"invalid">> => {
    const params = new URLSearchParams(base);
    const fields: Record<string, string> = Object.create(null);
    for (const [key, codec] of entries) {
      params.delete(key);
      try {
        // Each entry preserves its own codec/value correlation at runtime.
        const encoded = codec.format(value[key] as string | number);
        const canonical =
          encoded === undefined ? undefined : codec.parse(encoded);
        if (encoded === undefined || canonical === undefined) {
          fields[key] = `Choose ${codec.expected}.`;
          continue;
        }
        if (encoded !== codec.format(codec.defaultValue))
          params.append(key, encoded);
      } catch {
        fields[key] = `Choose ${codec.expected}.`;
      }
    }
    return Object.keys(fields).length
      ? err(invalid("The URL state could not be updated.", fields))
      : ok(params);
  };
  return {
    defaults,
    read,
    write,
    update(query, change) {
      try {
        return write(change(read(query).value), query);
      } catch {
        return err(invalid("The URL state could not be updated.", {}));
      }
    },
  };
}
