import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact }) => {
  page.on("dialog", (dialog) => dialog.accept());
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      /hydration|did not match|cannot be passed/i.test(m.text())
    )
      errors.push(m.text());
  });
  const choose = async (label, option) => {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  await page.goto(base + "/cookbook/items?item=api&keep=1");
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "From a list to a saved change" }),
  ).toBeVisible({
    timeout: 30000,
  });
  const detail = page.getByRole("region", { name: "Selected item" });
  const name = detail.getByRole("textbox", { name: "Item name", exact: true });
  const host = detail.getByRole("textbox", { name: "Hostname", exact: true });
  const save = detail.getByRole("button", {
    name: "Save changes",
    exact: true,
  });
  const status = detail.getByRole("status");
  await expect(name).toHaveValue("API service");
  await expect(save).toBeDisabled();
  assert.equal(
    new URL(page.url()).searchParams.get("keep"),
    "1",
    "initial query",
  );
  await name.fill("");
  await save.click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  await name.fill("API renamed");
  await host.fill("jobs.example.com");
  await save.click();
  await expect(host).toHaveAttribute("aria-invalid", "true");
  await name.fill("API updated");
  await expect(host).toHaveAttribute("aria-invalid", "true");
  await host.fill("api.internal");
  await expect(host).not.toHaveAttribute("aria-invalid", "true");
  await save.click();
  await expect(status).toHaveText(
    "Saved. Your current draft matches the confirmed item.",
  );
  await expect(
    page.getByRole("button", { name: "Open API updated", exact: true }),
  ).toBeVisible();
  await choose("Item save behavior", "Hold the save response");
  await name.fill("Captured draft");
  await save.click();
  await expect(save).toBeDisabled();
  await name.fill("Newer edits");
  await detail.getByRole("button", { name: "Release held response" }).click();
  await expect(status).toHaveText(
    "The earlier draft is saved. Your newer edits are still unsaved.",
  );
  await expect(name).toHaveValue("Newer edits");
  await choose("Item save behavior", "Save commits, response is lost");
  await save.click();
  await expect(status).toContainText("Save outcome unknown");
  await expect(save).toBeDisabled();
  await name.fill("After uncertain save");
  await page.reload();
  await expect(name).toHaveValue("After uncertain save");
  await expect(status).toContainText("Save outcome unknown");
  await page
    .getByRole("checkbox", { name: "Make receipt checks fail" })
    .check();
  await detail.getByRole("button", { name: "Check save outcome" }).click();
  await expect(
    detail.getByText(
      "The save receipt could not be checked. Keep your draft and try checking again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(save).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Make receipt checks fail" })
    .uncheck();
  await detail.getByRole("button", { name: "Check save outcome" }).click();
  await expect(status).toHaveText(
    "The earlier draft is saved. Your newer edits are still unsaved.",
  );
  await expect(name).toHaveValue("After uncertain save");
  await choose("Item save behavior", "Request is not delivered");
  await save.click();
  await expect(status).toContainText("Save outcome unknown");
  await detail.getByRole("button", { name: "Check save outcome" }).click();
  await expect(status).toHaveText(
    "No save was recorded. Your draft is ready for another attempt.",
  );
  await choose("Item save behavior", "Item changes elsewhere");
  await save.click();
  await expect(
    detail.getByText(/This item changed since you opened it/),
  ).toBeVisible();
  await expect(name).toHaveValue("After uncertain save");
  await detail.getByRole("button", { name: "Reload saved version" }).click();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(name).toHaveValue("After uncertain save");
  await choose("Item save behavior", "Save successfully");
  await detail.getByRole("button", { name: "Reload saved version" }).click();
  await page
    .getByRole("button", { name: "Load saved version", exact: true })
    .click();
  await expect(name).toHaveValue("Newer edits (updated elsewhere)");
  await name.fill("Protected draft");
  await page
    .getByRole("button", { name: "Open Background jobs", exact: true })
    .click();
  await expect(name).toHaveValue("Background jobs");
  await page.goBack();
  await expect(name).toHaveValue("Protected draft");
  const beforeSidebar = page.url();
  await page
    .getByRole("navigation", { name: "Cookbook pages" })
    .getByRole("link", { name: "URL state", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make the view shareable" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(beforeSidebar);
  await expect(name).toHaveValue("Protected draft");
  assert.equal(new URL(page.url()).searchParams.get("keep"), "1");
  await detail
    .getByRole("button", { name: "Discard edits", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Discard edits", exact: true })
    .click();
  await expect(name).toHaveValue("Newer edits (updated elsewhere)");
  await page
    .getByRole("textbox", { name: "Search items" })
    .fill("not a matching item");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByText("No matching items", { exact: true }),
  ).toBeVisible();
  await expect(name).toHaveValue("Newer edits (updated elsewhere)");
  await page.getByRole("button", { name: "Clear item filters" }).click();
  await choose("Item read behavior", "Malformed response");
  await page.getByRole("button", { name: "Refresh collection" }).click();
  await expect(
    page.getByText("The collection could not be refreshed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Background jobs" }),
  ).toBeVisible();
  await choose("Item read behavior", "Successful read");
  await page.getByRole("button", { name: "Refresh collection" }).click();
  await expect(
    page.getByText("The collection could not be refreshed", { exact: true }),
  ).toHaveCount(0);
  await page.goto(base + "/cookbook/items?item=missing&page=999");
  await expect(page.getByText("Item not found", { exact: true })).toBeVisible();
  await expect(
    page.getByText("This page is outside the results", { exact: true }),
  ).toBeVisible();
  await expect(detail.getByRole("textbox")).toHaveCount(0);
  await page.goto(base + "/cookbook/items?item=api");
  await expect(name).toHaveValue("Newer edits (updated elsewhere)");
  await choose("Item save behavior", "Hold the save response");
  await name.fill("Pending across reload");
  await save.click();
  await expect(
    detail.getByRole("button", { name: "Release held response" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const key = Object.keys(sessionStorage).find(
          (k) => k.includes("flover.cookbook.items") && k.endsWith(":data"),
        );
        return JSON.parse(sessionStorage.getItem(key)).value.items.find(
          (i) => i.id === "api",
        ).name;
      }),
    )
    .toBe("Pending across reload");
  await page.reload();
  await expect(name).toHaveValue("Pending across reload");
  await expect(status).toContainText("Save outcome unknown");
  await detail.getByRole("button", { name: "Check save outcome" }).click();
  await expect(status).toHaveText(
    "Saved. Your current draft matches the confirmed item.",
  );
  // Storage failures cannot look like successful recovery protection.
  await page.evaluate(() => {
    window.__originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        this === sessionStorage &&
        key.includes("flover.cookbook.items") &&
        key.endsWith(":drafts")
      )
        throw new DOMException("Full", "QuotaExceededError");
      return window.__originalSet.call(this, key, value);
    };
  });
  await name.fill("Kept during storage failure");
  await expect(
    detail.getByText("Draft recovery is not protected", { exact: true }),
  ).toBeVisible();
  await save.click();
  await expect(name).toHaveValue("Kept during storage failure");
  await expect(status).toHaveText("Save refused. Your edits are still here.");
  await page.evaluate(() => (Storage.prototype.setItem = window.__originalSet));
  await detail.getByRole("button", { name: "Retry draft checkpoint" }).click();
  await expect(
    detail.getByText("Draft recovery is not protected", { exact: true }),
  ).toHaveCount(0);
  await save.click();
  await expect(status).toHaveText(
    "Saved. Your current draft matches the confirmed item.",
  );
  console.log(
    "Item workflow: client/server field errors, confirmed saves, late edits, lost response + reload reconciliation, failed lookup, terminal absence, conflicts, draft navigation/back, missing item, malformed reads, storage refusal and recovery passed.",
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
      await page
        .getByRole("heading", { name: "From a list to a saved change" })
        .scrollIntoViewIfNeeded();
      const metrics = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        controls: [
          ...document.querySelectorAll("main input,main [role=combobox]"),
        ].map((el) => ({
          right: el.getBoundingClientRect().right,
          w: el.getBoundingClientRect().width,
        })),
      }));
      assert.ok(metrics.scroll <= width + 1, JSON.stringify(metrics));
      for (const c of metrics.controls)
        assert.ok(c.right <= width + 1, JSON.stringify(c));
      await page.screenshot({
        path: artifact(`flover-items-${theme}-${width}.png`),
        caret: "initial",
        fullPage: true,
      });
      await detail.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: artifact(`flover-items-editor-${theme}-${width}.png`),
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
          .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0);
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
          "main article p,main article label,main article input",
        ),
      ]
        .filter((el) => el.textContent?.trim() || el.value)
        .map((el) => {
          const a = lum(parse(getComputedStyle(el).color)),
            b = lum(bg(el));
          return {
            text: (el.textContent || el.value).slice(0, 45),
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          };
        });
    });
    assert.ok(contrast.length > 10);
    for (const sample of contrast)
      assert.ok(sample.ratio >= 4.5, JSON.stringify(sample));
    console.log(
      theme,
      "minimum sampled text contrast",
      Math.min(...contrast.map((x) => x.ratio)),
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Reset item demo" }).click();
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await expect(name).toHaveValue("API service");
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log("Themes, mobile/desktop bounds, reset and hydration passed.");
};
