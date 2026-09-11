import { conflict, err, invalid, ok, type Result } from "../kernel";
import type {
  DocumentSchema,
  StoragePort,
  Stored,
  StoredDocument,
} from "./port";

type Envelope = { version: number; value: unknown };
const malformed = () =>
  invalid("The saved document is invalid.", {}, { type: "storage_invalid" });
function envelope(raw: string): Result<Envelope> {
  try {
    const data: unknown = JSON.parse(raw);
    if (
      typeof data !== "object" ||
      data === null ||
      !("version" in data) ||
      !("value" in data) ||
      !Number.isSafeInteger(data.version) ||
      (data.version as number) < 1
    )
      return err(malformed());
    return ok({ version: data.version as number, value: data.value });
  } catch {
    return err(malformed());
  }
}

/** No `read<T>(key)` assertion: every read proves the registered schema. */
export function createDocument<T>(
  port: StoragePort,
  namespace: string,
  schema: DocumentSchema<T>,
): StoredDocument<T> {
  const key = `${encodeURIComponent(namespace)}:${encodeURIComponent(schema.key)}`;
  const future = () =>
    conflict(
      "This document was saved by a newer version. Reset it explicitly before replacing it.",
      { type: "storage_version" },
    );
  function decode(value: unknown): Result<T> {
    try {
      return schema.decode(value);
    } catch {
      return err(malformed());
    }
  }
  function read(): Result<Stored<T>> {
    const raw = port.read(key);
    if (!raw.ok) return err(raw.error);
    if (raw.value === null) return ok({ state: "missing" });
    const saved = envelope(raw.value);
    if (!saved.ok) return err(saved.error);
    if (saved.value.version > schema.version) return err(future());
    const migrated = saved.value.version < schema.version;
    let value: Result<T>;
    if (migrated) {
      if (!schema.migrate)
        return err(
          conflict(
            "This saved version needs a migration or an explicit reset.",
            {
              type: "storage_version",
            },
          ),
        );
      try {
        value = schema
          .migrate(saved.value.value, saved.value.version)
          .andThen(decode);
      } catch {
        return err(malformed());
      }
    } else value = decode(saved.value.value);
    return value.map((value) => ({ state: "found" as const, value, migrated }));
  }
  return {
    read,
    write(value) {
      if (!Number.isSafeInteger(schema.version) || schema.version < 1)
        return err(malformed());
      const checked = decode(value);
      if (!checked.ok) return err(checked.error);
      let raw: string;
      try {
        raw = JSON.stringify({ version: schema.version, value: checked.value });
        const encoded = envelope(raw);
        if (!encoded.ok) return err(encoded.error);
        const roundtrip = decode(encoded.value.value);
        if (!roundtrip.ok) return err(roundtrip.error);
      } catch {
        return err(malformed());
      }
      const previous = port.read(key);
      if (!previous.ok) return err(previous.error);
      if (previous.value !== null) {
        const existing = envelope(previous.value);
        if (existing.ok && existing.value.version > schema.version)
          return err(future());
      }
      return port.write(key, raw);
    },
    remove: () => port.remove(key),
    subscribe: (listener) => port.subscribe(key, listener),
  };
}
