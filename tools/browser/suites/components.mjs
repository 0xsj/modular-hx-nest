import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact }) => {
  {
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    // A fresh development document used to register primitive before reset,
    // leaving the right classes on buttons whose actual styles were erased.
    await page.goto(base + "/kitchen-sink/chrome");
    for (const theme of ["Light", "Dark"]) {
      await page
        .getByRole("radio", { name: theme, exact: true })
        .first()
        .check();
      let comfortableHeight;
      for (const density of ["Comfortable", "Compact"]) {
        await page
          .getByRole("radio", { name: density, exact: true })
          .first()
          .check();
        const offsets = await page
          .locator('[data-scope="radio-group"][data-part="item"]')
          .evaluateAll((items) =>
            items.map((item) => {
              const outer = item.getBoundingClientRect();
              const inner = item
                .querySelector('[data-part="item-text"]')
                .getBoundingClientRect();
              return Math.abs(
                outer.y + outer.height / 2 - inner.y - inner.height / 2,
              );
            }),
          );
        assert.equal(offsets.length, 10);
        assert.ok(
          offsets.every((offset) => offset < 0.6),
          "Preference labels are vertically centered",
        );
        for (const name of ["Small", "Medium"]) {
          const style = await page
            .getByRole("button", { name, exact: true })
            .evaluate((button) => {
              const css = getComputedStyle(button);
              return {
                border: parseFloat(css.borderTopWidth),
                padding: parseFloat(css.paddingInlineStart),
                height: button.getBoundingClientRect().height,
              };
            });
          assert.ok(
            style.border > 0 && style.padding > 0,
            `${name} retains its button styling`,
          );
          if (name === "Medium") {
            if (density === "Comfortable") comfortableHeight = style.height;
            else
              assert.ok(
                style.height < comfortableHeight,
                "Compact reduces control height",
              );
          }
        }
      }
    }
    await page
      .getByRole("radio", { name: "Comfortable", exact: true })
      .first()
      .check();
    console.log(
      "Preference label centering, CSS cascade and density sizing passed.",
    );

    for (const route of ["statistical-charts", "networks", "shells"]) {
      const response = await page.goto(base + "/kitchen-sink/" + route, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        1440,
      );
      console.log(route, "cases", await page.locator("[data-case]").count());
      await page.screenshot({
        caret: "initial",
        path: artifact("flover-" + route + "-port.png"),
        fullPage: true,
      });
    }

    await page.goto(base + "/kitchen-sink/shells", {
      waitUntil: "networkidle",
    });

    const railElement = page.locator(
      'iframe[title="Rail application shell preview"]',
    );

    await railElement.scrollIntoViewIfNeeded();

    const railFrame = page.frameLocator(
      'iframe[title="Rail application shell preview"]',
    );

    await railFrame
      .getByRole("heading", { name: "Overview", level: 1 })
      .waitFor();

    await page.getByRole("radio", { name: "Light", exact: true }).click();

    await page.getByRole("radio", { name: "Compact", exact: true }).click();

    await railFrame
      .locator('html[data-theme="light"][data-density="compact"]')
      .waitFor();

    await railFrame.getByRole("radio", { name: "Dark", exact: true }).click();

    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );

    await expect(
      page.getByRole("radio", { name: "Dark", exact: true }),
    ).toBeChecked();

    console.log("Gallery and iframe theme/density preferences stay in sync.");

    for (const theme of ["Light", "Dark"]) {
      await page.getByRole("radio", { name: theme, exact: true }).click();
      for (const route of ["statistical-charts", "networks"]) {
        await page.goto(base + "/kitchen-sink/" + route, {
          waitUntil: "networkidle",
        });
        const measurements = await page.evaluate(() => {
          const parse = (value) => {
            const p = value.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
            return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
          };
          const luminance = (rgb) =>
            rgb
              .slice(0, 3)
              .map((c) => {
                const n = c / 255;
                return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
              })
              .reduce(
                (total, c, i) => total + c * [0.2126, 0.7152, 0.0722][i],
                0,
              );
          const bg = (el) => {
            const chain = [];
            for (let p = el; p; p = p.parentElement) chain.unshift(p);
            return chain.reduce(
              (base, p) => {
                const color = parse(getComputedStyle(p).backgroundColor);
                return base.map(
                  (v, i) => color[i] * color[3] + v * (1 - color[3]),
                );
              },
              [255, 255, 255],
            );
          };
          return Array.from(document.querySelectorAll("svg text"))
            .slice(0, 30)
            .map((el) => {
              const style = getComputedStyle(el),
                a = luminance(parse(style.fill)),
                b = luminance(bg(el));
              return {
                text: el.textContent,
                size: style.fontSize,
                contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              };
            });
        });
        assert.ok(measurements.length > 0);
        for (const sample of measurements)
          assert.ok(sample.contrast >= 4.5, JSON.stringify(sample));
        console.log(
          theme,
          route,
          "sample text contrast minimum",
          Math.min(...measurements.map((sample) => sample.contrast)),
        );
        await page.screenshot({
          caret: "initial",
          path: artifact(
            "flover-" + route + "-" + theme.toLowerCase() + "-viewport.png",
          ),
          fullPage: false,
        });
      }
    }

    await page.goto(base + "/kitchen-sink/networks", {
      waitUntil: "networkidle",
    });

    const graph = page.getByRole("group", {
      name: "Workspace relationships",
      exact: true,
    });

    const positions = await graph
      .locator('g[role="button"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("transform")),
      );

    await graph.getByRole("button", { name: "Projects", exact: true }).focus();

    await page.keyboard.press("Enter");

    assert.equal(
      await graph
        .getByRole("button", { name: "Projects", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );

    assert.deepEqual(
      await graph
        .locator('g[role="button"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("transform")),
        ),
      positions,
    );

    await page.keyboard.press("Space");

    assert.equal(
      await graph
        .getByRole("button", { name: "Projects", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );

    await page.goto(base + "/kitchen-sink/statistical-charts", {
      waitUntil: "networkidle",
    });

    const matrix = page.getByRole("group", {
      name: "Workspace coverage",
      exact: true,
    });

    await matrix
      .getByRole("button", { name: "Atlas · Checks — 82", exact: true })
      .focus();

    await page.keyboard.press("Enter");

    assert.match(
      await page.locator('#matrix-selection [role="status"]').textContent(),
      /Atlas · Checks/,
    );

    await page.goto(base + "/shell-preview/rail", { waitUntil: "networkidle" });

    assert.equal(await page.getByRole("main").count(), 1);

    await page
      .getByRole("navigation", { name: "Application sections" })
      .getByRole("link", { name: "Reports", exact: true })
      .click();

    await page.getByRole("heading", { name: "Summary", level: 1 }).waitFor();

    await page
      .getByRole("navigation", { name: "Reports pages" })
      .getByRole("link", { name: "Exports", exact: true })
      .click();

    await page.getByRole("heading", { name: "Exports", level: 1 }).waitFor();

    await page.screenshot({
      caret: "initial",
      path: artifact("flover-rail-open.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: "Hide section navigation" }).click();

    assert.equal(
      await page.getByRole("navigation", { name: "Reports pages" }).count(),
      0,
    );

    assert.equal(
      await page
        .getByRole("navigation", { name: "Application sections" })
        .isVisible(),
      true,
    );

    await page.screenshot({
      caret: "initial",
      path: artifact("flover-rail-collapsed.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: "Show section navigation" }).click();

    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of [
        "kitchen-sink/statistical-charts",
        "kitchen-sink/networks",
        "kitchen-sink/shells",
        "shell-preview/rail",
        "shell-preview/standard",
      ]) {
        await page.goto(base + "/" + route, { waitUntil: "networkidle" });
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          width,
          route + " overflows at " + width,
        );
        if (route === "shell-preview/rail" && width === 390) {
          await page
            .getByRole("button", { name: "Hide section navigation" })
            .click();
          await page.screenshot({
            caret: "initial",
            path: artifact("flover-rail-mobile.png"),
            fullPage: false,
          });
          await page
            .getByRole("button", { name: "Show section navigation" })
            .click();
          assert.equal(
            await page
              .getByRole("navigation", { name: "Workspace pages" })
              .isVisible(),
            true,
          );
          await page.screenshot({
            caret: "initial",
            path: artifact("flover-rail-mobile-open.png"),
            fullPage: false,
          });
        }
      }
    }

    console.log(
      "Chart keyboard selection, geometry stability, rail navigation/collapse, mobile widths passed.",
    );

    console.log("Page/console errors:", JSON.stringify(errors));

    assert.equal(errors.length, 0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  {
    await page.goto(base + "/kitchen-sink/tables", {
      waitUntil: "networkidle",
    });

    const catalog = page.getByRole("navigation", {
      name: "Component catalog",
      exact: true,
    });

    assert.equal(
      await catalog
        .getByRole("link", { name: "Tables", exact: true })
        .getAttribute("aria-current"),
      "page",
    );

    await page.getByRole("button", { name: "Members", exact: true }).click();

    assert.equal(
      await page
        .getByRole("columnheader", { name: "Members", exact: true })
        .getAttribute("aria-sort"),
      "ascending",
    );

    await page
      .getByRole("checkbox", { name: "Select Drift", exact: true })
      .click();

    await expect(
      page.getByRole("checkbox", {
        name: "Select projects on this page",
        exact: true,
      }),
    ).toBeChecked({ indeterminate: true });

    await page.getByRole("button", { name: "Next page", exact: true }).click();

    assert.match(
      await page.locator('#collection-table [role="status"]').textContent(),
      /1 selected/,
    );

    await page
      .getByRole("searchbox", { name: "Search projects" })
      .fill("no-such-project");

    assert.equal(
      await page.getByText("No matching projects", { exact: true }).isVisible(),
      true,
    );

    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();

    assert.equal(
      await page
        .getByRole("table", { name: "Workspace projects · fixture data" })
        .isVisible(),
      true,
    );

    const toc = page.getByRole("navigation", {
      name: "On this page",
      exact: true,
    });

    await toc.getByRole("link", { name: "Cell composition" }).click();

    assert.match(page.url(), /#cell-composition$/);

    await page.waitForFunction(
      () =>
        document.querySelector("#cell-composition").getBoundingClientRect()
          .top >= 60,
    );

    console.log(
      "Table: sort, selection, paging, search, empty recovery, anchors passed",
    );

    await catalog.getByRole("link", { name: "Charts", exact: true }).click();

    await page.getByRole("heading", { name: "Charts", level: 1 }).waitFor();

    assert.equal(
      await catalog
        .getByRole("link", { name: "Charts", exact: true })
        .getAttribute("aria-current"),
      "page",
    );

    await page.getByRole("button", { name: "14 days", exact: true }).click();

    assert.equal(
      await page
        .getByRole("button", { name: "14 days", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );

    await page
      .getByText("View data for Completed work over 14 days", { exact: true })
      .click();

    assert.equal(
      await page
        .getByRole("table", {
          name: "Completed work over 14 days",
          exact: true,
        })
        .getByRole("row")
        .count(),
      15,
    );

    assert.equal(
      await toc
        .getByRole("link", { name: "Collection table", exact: true })
        .count(),
      0,
    );

    await toc
      .getByRole("link", { name: "Missing and negative values", exact: true })
      .click();

    await page.waitForFunction(
      () =>
        document.querySelector(
          'nav[aria-label="On this page"] a[aria-current="location"]',
        )?.textContent === "Missing and negative values",
    );

    await page.goBack();
    await expect(page).toHaveURL(/\/kitchen-sink\/charts$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/kitchen-sink\/tables#cell-composition$/);
    await expect(
      page.getByRole("heading", { name: "Tables", level: 1 }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/kitchen-sink\/tables$/);

    console.log(
      "Charts: period, exact data, route changes, active anchors, back navigation passed",
    );

    await page.goto(base + "/kitchen-sink/disclosure", {
      waitUntil: "networkidle",
    });

    const first = page.getByRole("button", {
      name: "What belongs in a workspace?",
      exact: true,
    });

    await first.focus();

    await page.keyboard.press("ArrowDown");

    assert.equal(
      await page
        .getByRole("button", {
          name: "Can I invite collaborators?",
          exact: true,
        })
        .evaluate((el) => el === document.activeElement),
      true,
    );

    await page.keyboard.press("Enter");

    await expect(first).toHaveAttribute("aria-expanded", "false");

    await page.goto(base + "/kitchen-sink/forms", { waitUntil: "networkidle" });

    const slider = page.getByRole("slider", { name: "Volume", exact: true });

    await slider.focus();

    await page.keyboard.press("End");

    await expect(slider).toHaveAttribute("aria-valuenow", "100");

    await page.keyboard.press("Home");

    await expect(slider).toHaveAttribute("aria-valuenow", "0");

    console.log("Accordion and slider: keyboard interaction passed");

    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(base + "/kitchen-sink", { waitUntil: "networkidle" });

    const toggle = page.getByRole("button", {
      name: "Browse components",
      exact: true,
    });

    assert.equal(await catalog.isVisible(), false);

    await toggle.click();

    assert.equal(await catalog.isVisible(), true);

    await page.screenshot({
      caret: "initial",
      path: artifact("flover-mobile-menu.png"),
      fullPage: false,
    });

    await catalog.getByRole("link", { name: "Charts", exact: true }).click();

    await page.getByRole("heading", { name: "Charts", level: 1 }).waitFor();

    assert.equal(await catalog.isVisible(), false);

    await page
      .getByRole("radio", { name: "Light", exact: true })
      .first()
      .click();

    await page
      .getByRole("radio", { name: "Compact", exact: true })
      .first()
      .click();

    await page.screenshot({
      caret: "initial",
      path: artifact("flover-mobile-charts.png"),
      fullPage: true,
    });

    const routes = [
      "charts",
      "tables",
      "patterns",
      "type-components",
      "forms",
      "feedback",
      "navigation",
      "disclosure",
      "display",
      "layout",
      "overlays",
      "utility",
      "tokens",
      "typography",
      "chrome",
      "shells",
      "data",
    ];

    for (const route of routes) {
      await page.goto(base + "/kitchen-sink/" + route, {
        waitUntil: "networkidle",
      });
      const width = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      console.log("Mobile width", route, width);
      assert.equal(width, 390, route + " overflows viewport");
    }

    await page.goto(base + "/kitchen-sink/tables", {
      waitUntil: "networkidle",
    });

    await page.screenshot({
      caret: "initial",
      path: artifact("flover-mobile-tables.png"),
      fullPage: true,
    });

    const region = page.getByRole("region", {
      name: "Workspace projects · fixture data",
    });

    await region.focus();
    await page.keyboard.press("ArrowRight");

    await page.waitForFunction(
      () =>
        document.querySelector(
          '[role="region"][aria-label="Workspace projects · fixture data"]',
        ).scrollLeft > 0,
    );

    await toggle.click();
    await page.keyboard.press("Escape");

    assert.equal(await toggle.getAttribute("aria-expanded"), "false");

    assert.equal(
      await toggle.evaluate((el) => el === document.activeElement),
      true,
    );

    console.log(
      "Mobile: disclosure menu, keyboard close, table scroll, light/compact, route overflow checks passed",
    );

    console.log("Page errors:", JSON.stringify(errors));

    assert.equal(errors.length, 0);
  }
};
