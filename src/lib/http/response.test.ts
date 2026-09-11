import { describe, expect, it } from "vitest";
import { isRetryable } from "../kernel";
import {
  responseArray,
  responseDecoder,
  responseObject,
  responseText,
  responseTimestamp,
} from "./response";

describe("successful response decoding", () => {
  it("distinguishes explicit null from a rejected shape", () => {
    const decode = responseDecoder("optional record", (value) =>
      value === null ? null : undefined,
    );
    expect(decode(null).unwrapOr("wrong")).toBeNull();
    const result = decode({ secret: "never disclose" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({
        kind: "internal",
        type: "invalid_response",
      });
      expect(isRetryable(result.error)).toBe(false);
      expect(JSON.stringify(result.error)).not.toContain("never disclose");
    }
  });

  it("contains a throwing reader without leaking its exception", () => {
    const decode = responseDecoder("safe", () => {
      throw new Error("secret token");
    });
    expect(decode({}).ok).toBe(false);
    expect(JSON.stringify(decode({}))).not.toContain("secret token");
  });

  it("allows falsy, deliberately decoded values", () => {
    for (const value of [false, 0, ""])
      expect(
        responseDecoder("value", () => value)(null).unwrapOr("wrong"),
      ).toBe(value);
  });

  it("validates every array member, including holes, and preserves order", () => {
    const read = responseArray((value) =>
      typeof value === "number" ? value : undefined,
    );
    expect(read([3, 1, 2])).toEqual([3, 1, 2]);
    expect(read([])).toEqual([]);
    expect(read([1, "2"])).toBeUndefined();
    expect(read(new Array(2))).toBeUndefined();
    expect(read(null)).toBeUndefined();
  });

  it("does not coerce records, text, or timestamps", () => {
    for (const value of [null, [], "{}", 0])
      expect(responseObject(value)).toBeUndefined();
    for (const value of [null, true, 123, "", "  "])
      expect(responseText(value)).toBe(false);
    for (const value of [
      "yesterday",
      "2026-01-01",
      "2026-99-01T00:00:00Z",
      123,
    ])
      expect(responseTimestamp(value)).toBe(false);
    expect(responseTimestamp("2026-09-10T12:30:00.000Z")).toBe(true);
    expect(responseTimestamp("2026-09-10T12:30:00+03:00")).toBe(true);
  });
});
