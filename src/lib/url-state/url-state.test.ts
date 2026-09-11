import { describe, expect, expectTypeOf, it } from "vitest";
import { choiceParam, integerParam, querySchema, textParam } from ".";

const schema = querySchema({
  q: textParam({ maxLength: 20 }),
  page: integerParam({ max: 100 }),
  view: choiceParam(["table", "cards"], "table"),
});

describe("typed query state", () => {
  it("infers field types and gives missing fields explicit defaults without issues", () => {
    expectTypeOf(schema.defaults).toEqualTypeOf<{
      readonly q: string;
      readonly page: number;
      readonly view: "table" | "cards";
    }>();
    expect(schema.read("unrelated=1")).toEqual({
      value: { q: "", page: 1, view: "table" },
      issues: [],
    });
  });

  it("reports malformed values without echoing them or replacing valid fields", () => {
    const result = schema.read("q=useful&page=PRIVATE_BAD_VALUE&view=cards");
    expect(result.value).toEqual({ q: "useful", page: 1, view: "cards" });
    expect(result.issues.map((issue) => issue.key)).toEqual(["page"]);
    expect(JSON.stringify(result.issues)).not.toContain("PRIVATE_BAD_VALUE");
  });

  it.each([
    "0",
    "-1",
    "+2",
    " 2 ",
    "2.5",
    "1e2",
    "2bad",
    "Infinity",
    "101",
    "9007199254740992",
    "",
  ])("rejects invalid integer %j", (raw) => {
    const params = new URLSearchParams({ page: raw });
    expect(schema.read(params).issues).toHaveLength(1);
    expect(schema.read(params).value.page).toBe(1);
  });

  it("rejects duplicate scalars, even when both values agree", () => {
    expect(schema.read("page=2&page=2").value.page).toBe(1);
    expect(schema.read("page=2&page=2").issues).toHaveLength(1);
    expect(
      schema.read("q=one&q=two&view=invalid").issues.map((issue) => issue.key),
    ).toEqual(["q", "view"]);
  });

  it("trims and bounds text and matches choices exactly", () => {
    expect(schema.read("q=%20hello%20&view=cards").value).toEqual({
      q: "hello",
      page: 1,
      view: "cards",
    });
    expect(
      schema.read(new URLSearchParams({ q: "a".repeat(21), view: "CARDS" }))
        .issues,
    ).toHaveLength(2);
  });

  it("omits defaults while preserving unrelated repeated keys without mutating the base", () => {
    const base = new URLSearchParams(
      "keep=a&keep=b&page=9&view=cards&chaosSeed=7",
    );
    const before = base.toString();
    const result = schema.write({ q: "", page: 1, view: "table" }, base);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.toString()).toBe("keep=a&keep=b&chaosSeed=7");
    expect(base.toString()).toBe(before);
  });

  it("makes canonical writes idempotent and round-trips Unicode and special characters", () => {
    for (const q of [
      "",
      "hello world",
      "İstanbul",
      "雪",
      "a&b=+?#",
      "  trim me  ",
    ]) {
      for (const page of [1, 2, 100]) {
        const result = schema.write(
          { q, page, view: "cards" },
          "keep=a&keep=b",
        );
        if (!result.ok) throw new Error("expected a valid state");
        const read = schema.read(result.value);
        expect(read).toEqual({
          value: { q: q.trim(), page, view: "cards" },
          issues: [],
        });
        const again = schema.write(read.value, result.value);
        expect(again.ok && again.value.toString()).toBe(
          result.value.toString(),
        );
      }
    }
  });

  it("validates the full proposed state and normalizes only on explicit updates", () => {
    const base = new URLSearchParams("page=bad&q=valid&keep=1");
    expect(schema.read(base).issues).toHaveLength(1);
    expect(base.get("page")).toBe("bad");
    const corrected = schema.update(base, (state) => state);
    expect(corrected.ok && corrected.value.toString()).toBe("keep=1&q=valid");
    const refused = schema.write({ q: "valid", page: 0, view: "table" }, base);
    expect(!refused.ok && refused.error.kind).toBe("invalid");
    expect(base.get("page")).toBe("bad");
  });

  it("contains a failing updater", () => {
    expect(
      schema.update("", () => {
        throw new Error("PRIVATE");
      }).ok,
    ).toBe(false);
  });

  it("requires valid defaults and treats special object keys as ordinary owned keys", () => {
    expect(() => integerParam({ min: 0 })).toThrow();
    expect(() => textParam({ default: " padded " })).toThrow();
    expect(() => choiceParam(["a"], "b")).toThrow();
    const unusual = querySchema(
      Object.fromEntries([["__proto__", textParam()]]),
    );
    expect(unusual.read("__proto__=text").value.__proto__).toBe("text");
    expect(
      Object.getPrototypeOf(unusual.read("__proto__=text").value),
    ).toBeNull();
  });
});
