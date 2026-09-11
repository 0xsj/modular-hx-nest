// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  choiceParam,
  integerParam,
  querySchema,
  textParam,
} from "../url-state";
import { writeQueryState } from "./url-state";

const schema = querySchema({
  q: textParam(),
  page: integerParam(),
  view: choiceParam(["table", "cards"], "table"),
});
beforeEach(() => {
  window.history.replaceState(
    { view: "preserved" },
    "",
    "/cookbook/url-state?keep=a&keep=b#collection",
  );
});
afterEach(() => vi.restoreAllMocks());

describe("Solid Router URL write boundary", () => {
  it("merges rapid updates against the current address, keeping path and fragment", () => {
    expect(
      writeQueryState(schema, (state) => ({ ...state, q: "hello" })).ok,
    ).toBe(true);
    expect(
      writeQueryState(schema, (state) => ({
        ...state,
        view: "cards" as const,
        page: 2,
      })).ok,
    ).toBe(true);
    expect(window.location.pathname).toBe("/cookbook/url-state");
    expect(window.location.hash).toBe("#collection");
    expect(schema.read(window.location.search).value).toEqual({
      q: "hello",
      page: 2,
      view: "cards",
    });
    expect(new URLSearchParams(window.location.search).getAll("keep")).toEqual([
      "a",
      "b",
    ]);
  });

  it("pushes committed changes, replaces corrections, and skips exact no-ops", () => {
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    writeQueryState(schema, (current) => current);
    expect(push).not.toHaveBeenCalled();
    writeQueryState(schema, (current) => ({ ...current, page: 2 }));
    expect(push).toHaveBeenCalledWith(
      { view: "preserved" },
      "",
      "/cookbook/url-state?keep=a&keep=b&page=2#collection",
    );
    writeQueryState(schema, () => schema.defaults, "replace");
    expect(replace).toHaveBeenCalledWith(
      { view: "preserved" },
      "",
      "/cookbook/url-state?keep=a&keep=b#collection",
    );
  });

  it("invalid proposed state leaves the URL and history alone", () => {
    const before = window.location.href;
    const push = vi.spyOn(window.history, "pushState");
    const result = writeQueryState(schema, (state) => ({ ...state, page: -1 }));
    expect(!result.ok && result.error.kind).toBe("invalid");
    expect(window.location.href).toBe(before);
    expect(push).not.toHaveBeenCalled();
  });

  it("history refusal becomes a region-level Result with no exception text", () => {
    const before = window.location.href;
    vi.spyOn(window.history, "pushState").mockImplementation(() => {
      throw new DOMException("PRIVATE", "SecurityError");
    });
    const result = writeQueryState(schema, (state) => ({ ...state, page: 2 }));
    expect(!result.ok && result.error.type).toBe("url_state_unavailable");
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(window.location.href).toBe(before);
  });
});
