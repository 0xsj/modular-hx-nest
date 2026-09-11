import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact }) => {
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|did not match|cannot be passed/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto(base + "/cookbook/resilience");
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Build for the unexpected" }),
  ).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  const response = page.getByRole("article", {
    name: "Keep the last good view",
  });
  const race = page.getByRole("article", {
    name: "Let the latest selection win",
  });
  const note = page.getByRole("article", {
    name: "Keep the draft. Check the save.",
  });
  await response
    .getByRole("button", { name: "Wrong envelope", exact: true })
    .click();
  await expect(response.getByRole("status")).toHaveText(
    "Request failed. No data has been accepted.",
  );
  await expect(response.getByText("API service", { exact: true })).toHaveCount(
    0,
  );
  await response.getByRole("button", { name: "Load valid data" }).click();
  await expect(
    response.getByText("API service", { exact: true }),
  ).toBeVisible();
  await response.getByRole("button", { name: "Malformed list item" }).click();
  await expect(response.getByText("Stale data", { exact: true })).toBeVisible();
  await expect(
    response.getByText("API service", { exact: true }),
  ).toBeVisible();
  await expect(
    response.getByText("Background jobs", { exact: true }),
  ).toBeVisible();
  await response.getByRole("button", { name: "Refresh failure" }).click();
  await expect(
    response.getByText("The simulated data source is unavailable.", {
      exact: true,
    }),
  ).toBeVisible();
  await response.getByRole("button", { name: "Empty list" }).click();
  await expect(response.getByRole("status")).toHaveText(
    "Valid empty response accepted.",
  );
  await expect(response.getByText("API service", { exact: true })).toHaveCount(
    0,
  );
  await response.getByRole("button", { name: "Load valid data" }).click();
  await expect(response.getByRole("status")).toHaveText(
    "Valid response accepted.",
  );
  await expect(response.getByText("Stale data", { exact: true })).toHaveCount(
    0,
  );
  for (let replay = 0; replay < 2; replay++) {
    await race
      .getByRole("button", {
        name: replay ? "Replay sequence" : "Start sequence",
      })
      .click();
    await expect(
      race.getByText("Newer selection", { exact: true }),
    ).toBeVisible();
    await expect(
      race.getByRole("button", { name: "Release earlier response" }),
    ).toBeEnabled();
    await race
      .getByRole("button", { name: "Release earlier response" })
      .focus();
    await page.keyboard.press("Enter");
    await expect(race.getByRole("status")).toHaveText(
      "Earlier response delivered. The newer selection remains visible.",
    );
    await expect(
      race.getByText("Earlier selection", { exact: true }),
    ).toHaveCount(0);
  }
  await note
    .getByRole("textbox", { name: "Note title", exact: true })
    .fill("A carefully written draft");
  await note
    .getByLabel("Note body", { exact: true })
    .fill("Do not lose this.\nOr this second line.");
  await note.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(
    note.getByText("Outcome unknown", { exact: true }),
  ).toBeVisible();
  await expect(
    note.getByRole("button", { name: "Save note", exact: true }),
  ).toBeDisabled();
  await expect(note.getByLabel("Note body", { exact: true })).toHaveValue(
    "Do not lose this.\nOr this second line.",
  );
  await note.getByLabel("Make receipt checks fail", { exact: true }).check();
  await note
    .getByRole("button", { name: "Check save outcome", exact: true })
    .click();
  await expect(
    note.getByText(/The save receipt could not be checked/),
  ).toBeVisible();
  await expect(
    note.getByRole("button", { name: "Save note", exact: true }),
  ).toBeDisabled();
  await note.getByLabel("Make receipt checks fail", { exact: true }).uncheck();
  await note
    .getByRole("textbox", { name: "Note title", exact: true })
    .fill("Newer unsaved edits");
  await note
    .getByRole("button", { name: "Check save outcome", exact: true })
    .click();
  await expect(note.getByRole("status")).toHaveText(
    "The earlier draft is saved. Your newer edits are still unsaved.",
  );
  await expect(
    note.getByRole("textbox", { name: "Note title", exact: true }),
  ).toHaveValue("Newer unsaved edits");
  await expect(
    note.getByText("A carefully written draft", { exact: true }),
  ).toBeVisible();
  await note.getByLabel("Next save behavior", { exact: true }).click();
  await page
    .getByRole("option", { name: "Server refuses the title", exact: true })
    .click();
  await note.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(note.getByRole("status")).toHaveText(
    "Save refused. Your input has been preserved.",
  );
  await expect(
    note.getByRole("textbox", { name: "Note title", exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(
    note.getByRole("textbox", { name: "Note title", exact: true }),
  ).toHaveValue("Newer unsaved edits");
  await note.getByLabel("Next save behavior", { exact: true }).click();
  await page
    .getByRole("option", { name: "Save successfully", exact: true })
    .click();
  await note.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(note.getByRole("status")).toHaveText(
    "Saved. The current draft matches the confirmed receipt.",
  );
  await expect(
    note.getByRole("button", { name: "Save note", exact: true }),
  ).toBeDisabled();
  await note
    .getByRole("textbox", { name: "Note title", exact: true })
    .fill("Still here");
  await note.getByLabel("Next save behavior", { exact: true }).click();
  await page
    .getByRole("option", {
      name: "Request never reaches the server",
      exact: true,
    })
    .click();
  await note.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(
    note.getByText("Outcome unknown", { exact: true }),
  ).toBeVisible();
  await note
    .getByRole("button", { name: "Check save outcome", exact: true })
    .click();
  await expect(note.getByRole("status")).toHaveText(
    "No save was recorded. Your draft is ready for another attempt.",
  );
  await expect(
    note.getByRole("button", { name: "Save note", exact: true }),
  ).toBeEnabled();
  await expect(
    note.getByRole("textbox", { name: "Note title", exact: true }),
  ).toHaveValue("Still here");
  console.log(
    "Response decoding/recovery, response ordering/replay, draft preservation, uncertain-save reconciliation, refusal and no-commit cases passed.",
  );
  for (const theme of ["light", "dark"]) {
    await page.getByRole("button", { name: "Appearance", exact: true }).click();
    await page
      .getByRole("radio", {
        name: theme === "light" ? "Light" : "Dark",
        exact: true,
      })
      .click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        controls: [
          ...document.querySelectorAll("input,textarea,[role=combobox]"),
        ].map((el) => ({
          w: el.getBoundingClientRect().width,
          right: el.getBoundingClientRect().right,
        })),
      }));
      assert.ok(metrics.scroll <= width + 1, JSON.stringify(metrics));
      for (const el of metrics.controls)
        assert.ok(el.right <= width + 1, JSON.stringify(el));
      await page.screenshot({
        path: artifact(`flover-resilience-${theme}-${width}.png`),
        caret: "initial",
        fullPage: true,
      });
      await note.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: artifact(`flover-resilience-note-${theme}-${width}.png`),
        caret: "initial",
        fullPage: true,
      });
    }
    const contrast = await page.evaluate(() => {
      const parse = (v) => {
        const m = v.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
        return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1];
      };
      const lum = (a) =>
        a
          .slice(0, 3)
          .map((c) => {
            const n = c / 255;
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = (el) => {
        const chain = [];
        for (let p = el; p; p = p.parentElement) chain.unshift(p);
        return chain.reduce(
          (base, p) => {
            const c = parse(getComputedStyle(p).backgroundColor);
            return base.map((n, i) => c[i] * c[3] + n * (1 - c[3]));
          },
          [255, 255, 255],
        );
      };
      return [
        ...document.querySelectorAll(
          "main article p,main article label,main article input,main article textarea",
        ),
      ]
        .filter((el) => el.textContent?.trim() || el.value)
        .map((el) => {
          const st = getComputedStyle(el),
            a = lum(parse(st.color)),
            b = lum(bg(el));
          return {
            text: (el.textContent || el.value).slice(0, 55),
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            fg: st.color,
            bg: st.backgroundColor,
          };
        });
    });
    assert.ok(contrast.length >= 10, "Expected actual text samples");
    for (const sample of contrast)
      assert.ok(sample.ratio >= 4.5, JSON.stringify(sample));
    console.log(
      theme,
      "minimum text contrast",
      Math.min(...contrast.map((sample) => sample.ratio)),
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await note.getByRole("button", { name: "Reset note example" }).click();
  await expect(
    note.getByRole("textbox", { name: "Note title", exact: true }),
  ).toHaveValue("Launch checklist");
  await page.goto(base + "/cookbook");
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Resilience", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Resilience", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Build for the unexpected" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Cookbook pages" })
      .getByRole("link", { name: "Resilience", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(
    "Desktop/mobile, both themes, navigation, reset, and hydration checks passed.",
  );
};
