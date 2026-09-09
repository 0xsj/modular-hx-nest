import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore, persisted } from "./store";
import { THEMES, applyTheme, resolvedTheme, theme } from "./theme";
import { DENSITIES, applyDensity, density } from "./density";
import { beginInteraction, currentInteraction, endInteraction, interaction } from "./interaction";

/* Light tests, written with the implementation in view — enough to catch a
 * regression in the parts that are easy to get wrong and invisible when wrong. */

afterEach(() => {
  theme.set("system");
  density.set("comfortable");
  endInteraction();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.density;
  localStorage.clear();
});

describe("store", () => {
  it("does not notify when the value did not change", () => {
    const s = createStore("a");
    const listener = vi.fn();
    s.subscribe(listener);
    s.set("a");
    expect(listener, "a set to the same value is not a change").not.toHaveBeenCalled();
    s.set("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes", () => {
    const s = createStore(0);
    const listener = vi.fn();
    s.subscribe(listener)();
    s.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("server() keeps returning the initial value after a set", () => {
    const s = createStore("initial");
    s.set("changed");
    expect(
      s.server(),
      "a server render must not see a mutation from another request",
    ).toBe("initial");
  });
});

describe("persisted", () => {
  it("falls back when the stored value is not in the valid set", () => {
    localStorage.setItem("k", "nonsense");
    expect(persisted("k", "a", ["a", "b"] as const).read()).toBe("a");
  });

  it("survives storage that throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("private mode");
    });
    expect(
      persisted("k", "a", ["a", "b"] as const).read(),
      "a preference is not worth an exception",
    ).toBe("a");
    spy.mockRestore();
  });
});

describe("theme", () => {
  it("system REMOVES the attribute rather than writing a third value", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("system");
    expect(
      "theme" in document.documentElement.dataset,
      "a third attribute value would satisfy the :not() guard by accident",
    ).toBe(false);
  });

  it("resolves system against the media query, and never overrides an explicit choice", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(resolvedTheme("system")).toBe("dark");
    expect(resolvedTheme("light"), "an explicit choice ignores the OS").toBe("light");
    vi.unstubAllGlobals();
  });

  it("writing the store applies the attribute", () => {
    theme.set("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("has exactly three states", () => {
    expect([...THEMES]).toEqual(["system", "light", "dark"]);
  });
});

describe("density", () => {
  it("comfortable removes the attribute; compact sets it", () => {
    applyDensity("compact");
    expect(document.documentElement.dataset.density).toBe("compact");
    applyDensity("comfortable");
    expect("density" in document.documentElement.dataset).toBe(false);
  });

  it("has exactly two states", () => {
    expect([...DENSITIES]).toEqual(["comfortable", "compact"]);
  });
});

describe("interaction", () => {
  it("starts empty — no id is minted at module load", () => {
    expect(
      interaction.server(),
      "an id minted at module load is shared by every server request",
    ).toBe("");
  });

  it("begin mints and stores the same id", () => {
    const id = beginInteraction();
    expect(id).not.toBe("");
    expect(interaction.get(), "the returned id and the stored one cannot drift").toBe(id);
  });

  it("current JOINS an interaction under way rather than starting a new one", () => {
    const first = beginInteraction();
    expect(currentInteraction()).toBe(first);
  });

  it("current STARTS one when none has begun", () => {
    endInteraction();
    const id = currentInteraction();
    expect(id).not.toBe("");
    expect(interaction.get()).toBe(id);
  });

  it("two interactions are different", () => {
    expect(beginInteraction()).not.toBe(beginInteraction());
  });
});
