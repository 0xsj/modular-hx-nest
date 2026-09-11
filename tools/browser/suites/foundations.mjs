import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact }) => {
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      /hydration|did not match|cannot be passed/i.test(m.text())
    )
      errors.push(m.text());
  });
  const choose = async (label, option) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  await page.goto(
    base + "/cookbook/url-state?keep=a&keep=b&page=2&view=cards#collection",
  );
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make the view shareable" }),
  ).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByText("Showing 7–12 of 18 projects. Page 2 of 3.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Project view" })).toHaveText(
    "Cards",
  );
  await page.getByRole("textbox", { name: "Search projects" }).fill("Platform");
  await page.getByRole("button", { name: "Search", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Showing 1–6 of 6 projects. Page 1 of 1.", { exact: true }),
  ).toBeVisible();
  assert.equal(new URL(page.url()).searchParams.get("page"), null);
  assert.deepEqual(new URL(page.url()).searchParams.getAll("keep"), ["a", "b"]);
  // The sign-in redirect preserves query state; fragment checks start on the authenticated route.
  await page.evaluate(() =>
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search + "#collection",
    ),
  );
  await choose("Project status", "Active");
  await expect(
    page.getByText("Showing 1–4 of 4 projects. Page 1 of 1.", { exact: true }),
  ).toBeVisible();
  await choose("Project view", "Table");
  await expect(
    page.getByRole("table", { name: "Projects matching this view" }),
  ).toBeVisible();
  assert.equal(new URL(page.url()).hash, "#collection");
  await page.goBack();
  await expect(page.getByRole("combobox", { name: "Project view" })).toHaveText(
    "Cards",
  );
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "Project status" }),
  ).toHaveText("All statuses");
  await page.goForward();
  await expect(
    page.getByRole("combobox", { name: "Project status" }),
  ).toHaveText("Active");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Search projects" }),
  ).toHaveValue("Platform");
  await expect(
    page.getByRole("combobox", { name: "Project status" }),
  ).toHaveText("Active");
  await page
    .getByRole("textbox", { name: "Search projects" })
    .fill("An unsent search");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(
    page.getByRole("textbox", { name: "Search projects" }),
  ).toHaveValue("");
  await expect(
    page.getByRole("table", { name: "Projects matching this view" }),
  ).toBeVisible();
  assert.equal(new URL(page.url()).search, "?keep=a&keep=b");
  assert.equal(new URL(page.url()).hash, "#collection");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(
    page.getByText("Showing 7–12 of 18 projects. Page 2 of 3.", {
      exact: true,
    }),
  ).toBeVisible();
  await choose("Project view", "Cards");
  await expect(
    page.getByText("Showing 7–12 of 18 projects. Page 2 of 3.", {
      exact: true,
    }),
  ).toBeVisible();
  await choose("Sort projects", "Recently updated");
  await expect(
    page.getByText("Showing 1–6 of 18 projects. Page 1 of 3.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atlas", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search projects" })
    .fill("nothing matches here");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByText("No matching projects", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all projects" }).click();
  const malformed =
    "/cookbook/url-state?keep=a&keep=b&page=wat&status=active&status=paused&view=cards#collection";
  await page.goto(base + malformed);
  await expect(
    page.getByText("Some URL values could not be used", { exact: true }),
  ).toBeVisible();
  assert.equal(page.url(), base + malformed);
  await expect(
    page.getByRole("combobox", { name: "Project status" }),
  ).toHaveText("All statuses");
  const length = await page.evaluate(() => history.length);
  await page.getByRole("button", { name: "Use valid URL values" }).click();
  await expect(
    page.getByText("Some URL values could not be used", { exact: true }),
  ).toHaveCount(0);
  assert.equal(await page.evaluate(() => history.length), length);
  assert.equal(
    page.url(),
    base + "/cookbook/url-state?keep=a&keep=b&view=cards#collection",
  );
  await page.goto(base + "/cookbook/url-state?page=999&view=cards");
  await expect(
    page.getByText("This page is outside the results", { exact: true }),
  ).toBeVisible();
  assert.equal(new URL(page.url()).searchParams.get("page"), "999");
  await page.getByRole("button", { name: "Go to first page" }).click();
  await expect(
    page.getByText("Showing 1–6 of 18 projects. Page 1 of 3.", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("refused");
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy view link" }).click();
  await expect(
    page.getByText(
      "The link could not be copied. Copy the address from your browser’s address bar.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__copied = value;
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy view link" }).click();
  await expect(
    page.getByText(
      "Link copied. It includes this view’s current filters and page.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  assert.equal(await page.evaluate(() => window.__copied), page.url());
  console.log(
    "URL state: deep links, submit/filter/sort/page/view, defaults, history/reload, malformed repair, out-of-range recovery, fragments, unrelated parameters and clipboard outcomes passed.",
  );

  await page.goto(base + "/cookbook/diagnostics");
  await expect(
    page.getByRole("heading", { name: "Follow an interaction" }),
  ).toBeVisible();
  await expect(
    page.getByText("No recorded steps", { exact: true }),
  ).toBeVisible();
  const read = page.getByRole("article", { name: "Drive the request" });
  const timeline = page.getByRole("article", { name: "Interaction timeline" });
  const rows = timeline
    .getByRole("table", { name: "Diagnostic events" })
    .getByRole("row");
  await read.getByRole("button", { name: "Malformed success" }).click();
  await expect(rows).toHaveCount(7);
  await expect(rows.filter({ hasText: /request.*success/ })).toHaveCount(1);
  await expect(
    rows.filter({ hasText: /decode.*failure.*contract rejected/ }),
  ).toHaveCount(1);
  await read.getByRole("button", { name: "Recover read" }).click();
  await expect(read.getByText("API service", { exact: true })).toBeVisible();
  await expect(rows.filter({ hasText: /recovery.*success/ })).toHaveCount(1);
  await read.getByRole("button", { name: "Transport failure" }).click();
  await expect(read.getByRole("status")).toContainText(
    "Previous data remains visible",
  );
  await expect(read.getByText("API service", { exact: true })).toBeVisible();
  await timeline.getByRole("combobox", { name: "Trace", exact: true }).click();
  await page.getByRole("option").last().click();
  await expect(rows).toHaveCount(5);
  await expect(timeline.getByText(/^Correlation:/)).toBeVisible();
  await choose("Trace", "All traces");
  await read.getByRole("button", { name: "Hold response" }).click();
  await expect(
    read.getByRole("button", { name: "Cancel request" }),
  ).toBeEnabled();
  await expect(read.getByRole("status")).toContainText("Request in progress");
  await read.getByRole("button", { name: "Cancel request" }).focus();
  await page.keyboard.press("Enter");
  await expect(read.getByRole("status")).toContainText("Request canceled");
  await expect(rows.filter({ hasText: /request.*canceled/ })).toHaveCount(1);
  await read.getByRole("button", { name: "Recover read" }).click();
  await expect(read.getByRole("status")).toContainText("Read completed");
  await read.getByRole("button", { name: "Empty result" }).click();
  await expect(
    read.getByText("The request succeeded. No items were found.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(read.getByText("API service", { exact: true })).toHaveCount(0);
  await timeline.getByRole("button", { name: "Clear timeline" }).click();
  await expect(
    timeline.getByText("No recorded steps", { exact: true }),
  ).toBeVisible();
  await read.getByRole("button", { name: "Successful read" }).click();
  await expect(rows).toHaveCount(7);
  console.log(
    "Diagnostics: transport/decode distinction, correlation filtering, retained data, cancellation, recovery, empty and clear passed.",
  );

  for (const route of ["diagnostics", "url-state"]) {
    if (route === "url-state")
      await page.goto(base + "/cookbook/url-state?view=cards");
    for (const theme of ["light", "dark"]) {
      await page
        .getByRole("button", { name: "Appearance", exact: true })
        .click();
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
            ...document.querySelectorAll("main input,main [role=combobox]"),
          ].map((el) => ({
            w: el.getBoundingClientRect().width,
            right: el.getBoundingClientRect().right,
          })),
        }));
        assert.ok(metrics.scroll <= width + 1, JSON.stringify(metrics));
        for (const el of metrics.controls)
          assert.ok(el.right <= width + 1, JSON.stringify(el));
        await page.screenshot({
          path: artifact(`flover-${route}-${theme}-${width}.png`),
          caret: "initial",
          fullPage: true,
        });
        if (route === "diagnostics") {
          await timeline.scrollIntoViewIfNeeded();
          if (width === 390) {
            const region = page.getByRole("region", {
              name: "Diagnostic timeline",
              exact: true,
            });
            await region.focus();
            await page.keyboard.press("ArrowRight");
            await expect
              .poll(() => region.evaluate((el) => el.scrollLeft))
              .toBeGreaterThan(0);
            await region.evaluate((el) => (el.scrollLeft = 0));
          }
          await page.screenshot({
            path: artifact(`flover-${route}-timeline-${theme}-${width}.png`),
            caret: "initial",
            fullPage: true,
          });
        }
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
            "main article p,main article label,main article input,main article td,main article th",
          ),
        ]
          .filter((el) => el.textContent?.trim() || el.value)
          .map((el) => {
            const a = lum(parse(getComputedStyle(el).color)),
              b = lum(bg(el));
            return {
              text: (el.textContent || el.value).slice(0, 55),
              ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            };
          });
      });
      assert.ok(contrast.length >= 10, "Expected actual text samples");
      for (const sample of contrast)
        assert.ok(sample.ratio >= 4.5, JSON.stringify(sample));
      console.log(
        route,
        theme,
        "minimum sampled text contrast",
        Math.min(...contrast.map((s) => s.ratio)),
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(base + "/cookbook");
  for (const label of ["Diagnostics", "URL state"]) {
    await page
      .getByRole("main")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(
      page
        .getByRole("navigation", { name: "Cookbook pages" })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.goBack();
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(
    "Both themes, desktop/mobile bounds, sampled contrast, cookbook navigation and hydration checks passed.",
  );
};
