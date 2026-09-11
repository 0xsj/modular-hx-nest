// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore, persisted } from "./store";
import { applyTheme, resolvedTheme, theme, hydrateTheme } from "./theme";
import { applyDensity, density, hydrateDensity } from "./density";
import {
  beginInteraction,
  currentInteraction,
  endInteraction,
  interaction,
} from "./interaction";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.density;
  theme.set("system");
  density.set("comfortable");
  endInteraction();
});

describe("the store", () => {
  it("notifies on a change", () => {
    const s = createStore(1);
    const seen = vi.fn();
    s.subscribe(seen);
    s.set(2);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(s.get()).toBe(2);
  });

  it("does NOT notify on a no-op write — a fresh notification per render is a loop", () => {
    const s = createStore("a");
    const seen = vi.fn();
    s.subscribe(seen);
    s.set("a");
    expect(seen).not.toHaveBeenCalled();
  });

  it("unsubscribes", () => {
    const s = createStore(0);
    const seen = vi.fn();
    s.subscribe(seen)();
    s.set(1);
    expect(seen).not.toHaveBeenCalled();
  });

  it("the server snapshot is the initial value, whatever the client has done", () => {
    const s = createStore("default");
    s.set("changed");
    expect(s.server()).toBe("default");
  });
});

describe("persistence tolerates every way storage fails", () => {
  const p = persisted("k", "fallback", ["fallback", "other"] as const);

  it("falls back on an absent value", () => {
    expect(p.read()).toBe("fallback");
  });

  it("falls back on a value that is not in the set", () => {
    localStorage.setItem("k", "nonsense");
    expect(p.read()).toBe("fallback");
  });

  it("does not throw when storage itself throws", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    expect(() => p.read()).not.toThrow();
    expect(p.read()).toBe("fallback");
    spy.mockRestore();

    const spy2 = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(() => p.write("other")).not.toThrow();
    spy2.mockRestore();
  });
});

describe("theme has three states and the third is not the absence of a choice", () => {
  it("an explicit choice stamps the attribute", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("`system` REMOVES it, so the token layer's media query takes over", () => {
    applyTheme("light");
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("the resolved theme is not the choice", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(resolvedTheme("system")).toBe("dark");
    expect(resolvedTheme("light")).toBe("light"); // a choice wins over the system
    vi.unstubAllGlobals();
  });

  it("hydrating reads the stored choice and applies it", () => {
    localStorage.setItem("theme", "dark");
    hydrateTheme();
    expect(theme.get()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("density is a token override", () => {
  it("compact stamps the attribute the token layer keys on", () => {
    applyDensity("compact");
    expect(document.documentElement.dataset.density).toBe("compact");
  });

  it("comfortable removes it rather than writing a default", () => {
    applyDensity("compact");
    applyDensity("comfortable");
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  it("hydrating reads the stored choice", () => {
    localStorage.setItem("density", "compact");
    hydrateDensity();
    expect(density.get()).toBe("compact");
  });
});

describe("the interaction id", () => {
  it("is empty until one begins — never minted at module load", () => {
    expect(interaction.get()).toBe("");
  });

  it("beginning one returns the id it set, so the two cannot drift", () => {
    const id = beginInteraction();
    expect(id).toBeTruthy();
    expect(interaction.get()).toBe(id);
  });

  it("two interactions differ", () => {
    expect(beginInteraction()).not.toBe(beginInteraction());
  });

  it("current JOINS the one under way rather than starting another", () => {
    const id = beginInteraction();
    expect(currentInteraction()).toBe(id);
    expect(currentInteraction()).toBe(id);
  });

  it("and starts one when none is under way", () => {
    expect(interaction.get()).toBe("");
    const id = currentInteraction();
    expect(id).toBeTruthy();
    expect(interaction.get()).toBe(id);
  });
});
