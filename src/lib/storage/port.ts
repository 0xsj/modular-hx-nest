import type { Result } from "../kernel";

export type Unsubscribe = () => void;
export interface StoragePort {
  read(key: string): Result<string | null>;
  write(key: string, value: string): Result<void>;
  remove(key: string): Result<void>;
  subscribe(key: string, listener: () => void): Result<Unsubscribe>;
}

export type Stored<T> =
  { state: "missing" } | { state: "found"; value: T; migrated: boolean };
export interface DocumentSchema<T> {
  key: string;
  version: number;
  decode(value: unknown): Result<T>;
  /** Direct migration from a supported older version to the current schema. */
  migrate?(value: unknown, fromVersion: number): Result<T>;
}
export interface StoredDocument<T> {
  read(): Result<Stored<T>>;
  write(value: T): Result<void>;
  remove(): Result<void>;
  subscribe(listener: () => void): Result<Unsubscribe>;
}
