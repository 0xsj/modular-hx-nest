// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { RUNTIME_BOOT_SCRIPT } from "./boot";
import { hydrateDensity } from "./density";
import { hydrateTheme } from "./theme";

/* The script and the module path must produce the same document.
 *
 * They restate the same knowledge — two storage keys, two attribute names, four
 * sentinel values — because one of them has to run before the bundle exists.
 * Duplication that cannot be removed can still be made to fail loudly, and this
 * is that: run both against the same storage, require the same DOM out.
 *
 * Without it the drift is silent and its symptom is a flash, which reads as a
 * framework problem rather than as two files disagreeing. */

const runBoot = () => new Function(RUNTIME_BOOT_SCRIPT)();

function domState() {
  const d = document.documentElement;
  return { theme: d.dataset.theme, density: d.dataset.density };
}

function reset() {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.density;
}

describe("the boot script agrees with the module path", () => {
  beforeEach(reset);

  const cases = [
    { stored: {}, label: "nothing stored" },
    { stored: { theme: "dark" }, label: "dark" },
    { stored: { theme: "light" }, label: "light" },
    {
      stored: { theme: "system" },
      label: "system — the default, written back",
    },
    { stored: { density: "compact" }, label: "compact" },
    { stored: { theme: "dark", density: "compact" }, label: "both" },
    {
      stored: { theme: "sepia", density: "roomy" },
      label: "values from an older build",
    },
  ];

  for (const { stored, label } of cases) {
    it(`${label}`, () => {
      for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v);

      runBoot();
      const fromScript = domState();

      reset();
      for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v);
      hydrateTheme();
      hydrateDensity();
      const fromModule = domState();

      expect(fromScript).toEqual(fromModule);
    });
  }

  it("the comparison can actually see a disagreement", () => {
    // Without this the block above passes if `domState` always returns the same
    // thing — which it would if the script threw and the module also no-opped.
    localStorage.setItem("theme", "dark");
    runBoot();
    expect(domState()).toEqual({ theme: "dark", density: undefined });
    reset();
    expect(domState()).toEqual({ theme: undefined, density: undefined });
  });
});

describe("the boot script survives what storage does", () => {
  beforeEach(reset);

  it("a value from an older build is ignored rather than applied", () => {
    localStorage.setItem("theme", "midnight");
    runBoot();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("does not throw when storage throws", () => {
    const real = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("denied by the browser");
      },
    });
    try {
      expect(() => runBoot()).not.toThrow();
    } finally {
      if (real) Object.defineProperty(globalThis, "localStorage", real);
    }
  });

  it("writes nothing for the defaults, because the defaults are no attribute", () => {
    localStorage.setItem("theme", "system");
    localStorage.setItem("density", "comfortable");
    runBoot();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.hasAttribute("data-density")).toBe(false);
  });
});
