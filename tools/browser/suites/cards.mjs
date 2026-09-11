import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact, axePath }) => {
  const clickSurface = async (locator) => {
    await locator.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    const box = await locator.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const response = await page.goto(base + "/kitchen-sink/cards", {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Cards", level: 1 }).waitFor();
  console.log("Cases:", await page.locator("[data-case]").count());
  await page.screenshot({
    path: artifact("flover-cards.png"),
    caret: "initial",
    fullPage: true,
  });
  const atlas = page.getByRole("article", { name: "Atlas", exact: true });
  const pin = atlas.getByRole("button", { name: "Pin Atlas", exact: true });
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  assert.equal(new URL(page.url()).pathname, "/kitchen-sink/cards");
  await expect(atlas.getByRole("status")).toHaveText(
    "Pinned to your workspace",
  );
  await atlas.getByRole("link", { name: "Atlas", exact: true }).focus();
  await page.screenshot({
    path: artifact("flover-card-focus.png"),
    caret: "initial",
  });
  await page.keyboard.press("Tab");
  await expect(pin).toBeFocused();
  await clickSurface(
    atlas.getByText("Shared tools for the next release.", { exact: true }),
  );
  await expect(page).toHaveURL(/\/kitchen-sink\/patterns#detail-page-recipe$/);
  await page.goBack({ waitUntil: "networkidle" });
  const digest = page.getByRole("switch", {
    name: "Weekly digest",
    exact: true,
  });
  await expect(digest).toBeChecked();
  await digest.click();
  await expect(digest).not.toBeChecked();
  await page
    .getByRole("button", { name: "Save preference", exact: true })
    .click();
  await expect(
    page
      .getByRole("article", { name: "Weekly digest", exact: true })
      .getByRole("status"),
  ).toHaveText("Saved preference: disabled");
  await expect(
    page.getByRole("button", { name: "Save preference", exact: true }),
  ).toBeDisabled();
  const board = page.getByRole("radio", { name: "Board", exact: true }),
    list = page.getByRole("radio", { name: "List", exact: true });
  // A physical press lasts across the library's deferred roving-focus task.
  await board.focus();
  await page.keyboard.press("ArrowRight", { delay: 50 });
  await expect(list).toBeChecked();
  await page.keyboard.press("ArrowRight", { delay: 50 });
  await expect(board).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Timeline", exact: true }),
  ).toBeDisabled();
  await clickSurface(
    page.getByText("Scan and compare structured records.", { exact: true }),
  );
  await expect(list).toBeChecked();
  await clickSurface(
    page.getByText("Progress summaries and comparisons.", { exact: true }),
  );
  await expect(
    page.getByRole("checkbox", { name: "Reports", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Use this configuration", exact: true })
    .click();
  await expect(
    page.locator("#selectable-cards").getByRole("status"),
  ).toHaveText("Layout: list; sections: activity, reports");
  await page
    .getByRole("button", { name: "Reset choices", exact: true })
    .click();
  await expect(board).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Reports", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "Retry summary", exact: true })
    .click();
  await expect(
    page
      .getByRole("article", { name: "Workspace summary", exact: true })
      .getByRole("status"),
  ).toContainText("Summary refreshed");
  console.log(
    "Primary link hit area, independent action, settings save, single/multiple selection, native form values, reset and retry passed.",
  );
  await page.addScriptTag({ path: axePath });
  for (const theme of ["Light", "Dark"]) {
    await page.getByRole("radio", { name: theme, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.toLowerCase(),
    );
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await Promise.allSettled(
        document
          .getAnimations()
          .filter((a) => a.effect.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished),
      );
    });
    const violations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    );
    console.log(theme, "axe", JSON.stringify(violations));
    assert.deepEqual(violations, []);
    await page.keyboard.press("Tab");
    await atlas.getByRole("link", { name: "Atlas", exact: true }).focus();
    const ring = await atlas.evaluate((el) => {
      const style = getComputedStyle(el),
        rgb = (s) =>
          s
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number);
      const lum = (rgb) =>
        rgb
          .map((c) => {
            c /= 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          })
          .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
      const a = lum(rgb(style.outlineColor)),
        b = lum(rgb(style.backgroundColor));
      return {
        width: style.outlineWidth,
        style: style.outlineStyle,
        contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
    console.log(theme, "focus ring", ring);
    assert.equal(ring.style, "solid");
    assert.ok(parseFloat(ring.width) >= 2 && ring.contrast >= 3);
    await page.locator("#record-cards").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: artifact("flover-cards-" + theme.toLowerCase() + ".png"),
      caret: "initial",
    });
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const density of ["Comfortable", "Compact"]) {
      await page.getByRole("radio", { name: density, exact: true }).click();
      await expect(
        page.getByRole("radio", { name: density, exact: true }),
      ).toBeChecked();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
      );
      if (width === 390) {
        await page.locator("#selectable-cards").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: artifact(
            "flover-cards-mobile-" + density.toLowerCase() + ".png",
          ),
          caret: "initial",
        });
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "All widths/densities passed. Page/console errors:",
    JSON.stringify(errors),
  );
};
