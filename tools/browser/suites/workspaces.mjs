import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact }) => {
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|did not match|Svelte Flow|cannot be passed/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  async function overflow(label) {
    const size = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(size.scroll <= size.width + 1, label + JSON.stringify(size));
  }
  async function saved() {
    return page.evaluate(() => {
      const key = Object.keys(localStorage).find((key) =>
        key.startsWith("flover.cookbook.dashboard."),
      );
      return key ? { key, value: JSON.parse(localStorage.getItem(key)) } : null;
    });
  }
  await page.goto(base + "/cookbook/editable-dashboard");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make room for your work" }),
  ).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-widget]")).toHaveCount(4);
  await expect(
    page
      .getByRole("region", { name: "Customizable dashboard" })
      .locator("> div")
      .last(),
  ).toBeVisible();
  await overflow("dashboard desktop");

  await page.screenshot({
    path: artifact("flover-dashboard-initial.png"),
    caret: "initial",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("button", { name: "Arrange Requests", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Make narrower", exact: true })
    .click();
  await expect(
    page.getByText("Unsaved changes · sample data", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(
    page.getByText("Layout saved in this browser.", { exact: true }),
  ).toBeVisible();
  assert.equal(
    (await saved()).value.value.find((item) => item.id === "requests").width,
    5,
  );
  await page.reload();
  await expect(page.locator("[data-widget]")).toHaveCount(4);
  assert.equal(
    (await saved()).value.value.find((item) => item.id === "requests").width,
    5,
  );
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  const handle = page.locator('[data-widget="requests"] h3');
  const box = await handle.boundingBox(),
    grid = await page
      .getByRole("region", { name: "Customizable dashboard" })
      .locator("> div")
      .last()
      .boundingBox();
  await page.mouse.move(box.x + 30, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + 30 + (grid.width + 16) / 12, box.y + 8, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Save layout", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  assert.equal(
    (await saved()).value.value.find((item) => item.id === "requests").x,
    1,
  );
  const resizer = page.locator(
    '[data-widget="throughput"] button[aria-label^="Resize"]',
  );
  await resizer.scrollIntoViewIfNeeded();
  const resizeBox = await resizer.boundingBox();
  await page.mouse.move(resizeBox.x + 15, resizeBox.y + 15);
  await page.mouse.down();
  await page.mouse.move(resizeBox.x + 15, resizeBox.y + 71, { steps: 8 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Save layout", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  assert.equal(
    (await saved()).value.value.find((item) => item.id === "throughput").height,
    8,
  );
  await page.getByRole("button", { name: "Add widget", exact: true }).click();
  await page.getByRole("menuitem", { name: "Capacity", exact: true }).click();
  await expect(page.locator("[data-widget]")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Arrange Capacity", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Remove widget", exact: true })
    .click();
  await expect(page.locator("[data-widget]")).toHaveCount(4);
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  // Another tab's update is observed, but does not erase a local draft.
  await page
    .getByRole("button", { name: "Arrange Requests", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Make narrower", exact: true })
    .click();
  const remote = await page.context().newPage();
  await remote.goto(base + "/cookbook");
  await remote.evaluate(() => {
    const key = Object.keys(localStorage).find((key) =>
      key.startsWith("flover.cookbook.dashboard."),
    );
    const data = JSON.parse(localStorage.getItem(key));
    data.value = data.value.filter((item) => item.id !== "latency");
    localStorage.setItem(key, JSON.stringify(data));
  });
  await expect(
    page.getByText("The saved layout changed elsewhere", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-widget]")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Save layout", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Load saved layout", exact: true })
    .click();
  await expect(page.locator("[data-widget]")).toHaveCount(3);
  await remote.close();
  // A quota refusal must leave both the saved value and the live draft intact.
  const beforeQuota = await saved();
  await page
    .getByRole("button", { name: "Arrange Requests", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Make narrower", exact: true })
    .click();
  await page.evaluate(() => {
    window.restoreStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(
    page.getByText("Your changes were not saved", { exact: true }),
  ).toBeVisible();
  assert.deepEqual(await saved(), beforeQuota);
  await page.evaluate(() => {
    Storage.prototype.setItem = window.restoreStorage;
  });
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect(
    page.getByText("Layout saved in this browser.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset saved layout", exact: true })
    .click();
  await expect(page.locator("[data-widget]")).toHaveCount(4);
  // Future data is preserved, with explicit reset as recovery.
  await page.evaluate(() =>
    localStorage.setItem(
      "flover.cookbook.dashboard.test:layout",
      JSON.stringify({ version: 99, value: [] }),
    ),
  );
  await page
    .getByRole("button", { name: "Arrange Requests", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Make narrower", exact: true })
    .click();
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  const current = await page.evaluate(() =>
    Object.keys(localStorage).find(
      (key) =>
        key.startsWith("flover.cookbook.dashboard.") && !key.includes(".test:"),
    ),
  );
  await page.evaluate(
    (key) =>
      localStorage.setItem(key, JSON.stringify({ version: 99, value: [] })),
    current,
  );
  await page.reload();
  await expect(
    page.getByText("Saved layout could not be loaded", { exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).version,
      current,
    ),
    99,
  );
  await page
    .getByRole("button", { name: "Reset saved layout", exact: true })
    .click();
  await page.evaluate(() =>
    localStorage.removeItem("flover.cookbook.dashboard.test:layout"),
  );
  console.log(
    "Dashboard: keyboard arrange, drag, resize, add/remove, save/reload, cross-tab conflict, quota and version recovery passed.",
  );

  await page.goto(base + "/cookbook/canvas");
  await expect(page.locator("[data-node-id]")).toHaveCount(4);
  await expect(page.locator("[data-canvas-edge]")).toHaveCount(4);
  const node = page.locator('[data-node-id="sources"]');
  await expect(node).toBeVisible();
  await node.focus();
  await expect(node).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Item name", { exact: true })).toHaveValue(
    "Collect sources",
  );

  const prior = await node.getAttribute("style");
  await page.keyboard.press("ArrowRight");
  await expect(node).not.toHaveAttribute("style", prior);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Item name", { exact: true })).toHaveCount(0);
  await node.click();
  await page.getByLabel("Item name", { exact: true }).fill("Gather inputs");
  await expect(node).toContainText("Gather inputs");
  const nodeBox = await node.boundingBox();
  const pos = await node.getAttribute("style");
  await page.mouse.move(nodeBox.x + 60, nodeBox.y + 40);
  await page.mouse.down();
  await page.mouse.move(nodeBox.x + 105, nodeBox.y + 80, { steps: 8 });
  await page.mouse.up();
  await expect(node).not.toHaveAttribute("style", pos);
  await page
    .getByRole("button", { name: "Lock positions", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unlock positions", exact: true }),
  ).toBeVisible();
  await expect(node).not.toHaveClass(/draggable/);
  await expect(node).toBeVisible();
  await node.focus();
  await expect(node).toBeFocused();
  const locked = await node.getAttribute("style");
  await page.keyboard.press("ArrowRight");
  await expect(node).toHaveAttribute("style", locked);
  await page
    .getByRole("button", { name: "Unlock positions", exact: true })
    .click();
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.locator("[data-node-id]")).toHaveCount(5);
  await page.getByRole("button", { name: "Fit view", exact: true }).click();
  await expect(page.locator("[data-canvas-edge]")).toHaveCount(4);
  await page.screenshot({
    path: artifact("flover-canvas-desktop.png"),
    caret: "initial",
    fullPage: true,
  });
  await overflow("canvas desktop");
  console.log(
    "Canvas: keyboard selection/movement/escape, rename, pointer drag, lock, add and fit passed.",
  );

  await page.goto(base + "/cookbook/live-updates");
  await expect(page.getByText("1240", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Emit 5 updates", exact: true })
    .click();
  await expect(page.getByText("1325", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByRole("button", { name: "Emit update", exact: true }).click();
  await expect(page.getByText("1325", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect(page.getByText("1342", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Simulate read failure", exact: true })
    .click();
  await expect(
    page.getByText("The latest data could not be loaded", { exact: true }),
  ).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("1342", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Restore data source", exact: true })
    .click();
  await expect(
    page.getByText("The latest data could not be loaded", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("1376", { exact: true })).toBeVisible();
  await page.screenshot({
    path: artifact("flover-live-desktop.png"),
    caret: "initial",
    fullPage: true,
  });
  console.log(
    "Live updates: targeted refresh, missed events, reconnect resync, stale values during read failure and recovery passed.",
  );
  for (const theme of ["Light", "Dark"]) {
    await page.getByRole("button", { name: "Appearance", exact: true }).click();
    await page.getByRole("radio", { name: theme, exact: true }).click();
    await page.keyboard.press("Escape");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["editable-dashboard", "canvas", "live-updates"]) {
        await page.goto(base + "/cookbook/" + route);
        await expect(
          page.getByRole("main").getByRole("heading", { level: 1 }),
        ).toBeVisible();
        await overflow(theme + width + route);
        if (route === "canvas") {
          await expect(page.locator("[data-canvas-edge]")).toHaveCount(4);
          assert.ok(
            await page
              .locator("[data-canvas-edges]")
              .first()
              .evaluate((el) => el.getBoundingClientRect().width > 0),
          );
          await expect(
            page.getByRole("button", { name: "Fit view", exact: true }),
          ).toBeVisible();
        }
        await page.screenshot({
          path: artifact(`flover-${route}-${theme.toLowerCase()}-${width}.png`),
          caret: "initial",
          fullPage: true,
        });
      }
    }
  }
  await page.goto(base + "/kitchen-sink/workspaces");
  await expect(
    page.getByRole("heading", { name: "Interactive workspaces", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("No items on this canvas.", { exact: true }),
  ).toBeVisible();
  await overflow("catalog mobile");
  await page.goto(base + "/app");
  await expect(page.getByRole("main").getByRole("heading")).toHaveCount(1);
  assert.deepEqual(errors, []);
  console.log(
    "Both themes, desktop/mobile, catalog states, fresh app, and hydration checks passed.",
  );
};
