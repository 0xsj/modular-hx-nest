import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact, dev }) => {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const chapters = [
    "orientation",
    "layers",
    "results-and-failures",
    "add-a-feature",
    "backends",
    "state-and-recovery",
    "verification",
  ];
  const categories = [
    "tokens",
    "typography",
    "layout",
    "type-components",
    "forms",
    "pickers",
    "display",
    "feedback",
    "navigation",
    "disclosure",
    "overlays",
    "utility",
    "cards",
    "tables",
    "charts",
    "statistical-charts",
    "networks",
    "patterns",
    "shells",
    "workspaces",
    "chrome",
    "data",
  ];
  const routes = [
    "/",
    "/cookbook",
    "/cookbook/manual",
    ...chapters.map((chapter) => "/cookbook/manual/" + chapter),
    "/kitchen-sink",
    ...categories.map((category) => "/kitchen-sink/" + category),
    ...["rail", "standard", "auth"].map((shell) => "/shell-preview/" + shell),
    "/probe",
  ];
  async function visit(route) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200, route);
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
    assert.deepEqual(errors, [], route);
  }
  for (const route of routes) await visit(route);
  for (const [query, state, text] of [
    ["", "found", "api"],
    [
      "?chaos=GET%20/items=empty:list",
      dev ? "empty" : "found",
      dev ? "No targets yet." : "api",
    ],
    [
      "?chaos=GET%20/items=fail:rate_limited",
      dev ? "unmeasured" : "found",
      dev ? "rate_limited" : "api",
    ],
    ["?workspace=locked", "unmeasured", "Not your workspace."],
  ]) {
    await visit("/probe" + query);
    await expect(page.getByText(state, { exact: true })).toBeVisible();
    await expect(
      page.getByText(text, { exact: state !== "unmeasured" }),
    ).toBeVisible();
  }
  const download = await page.request.get(base + "/cookbook/manual/download");
  assert.equal(download.status(), 200);
  assert.match(download.headers()["content-type"], /markdown|text\/plain/);
  assert.match(await download.text(), /Result/);
  await page.goto(base + "/sign-in?returnTo=%2Fcookbook%2Fitems");
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/cookbook\/items$/);
  await page.waitForLoadState("networkidle");
  const recipes = [
    "session",
    "access",
    "jobs",
    "localization",
    "items",
    "dashboard",
    "activity",
    "url-state",
    "editable-dashboard",
    "canvas",
    "live-updates",
    "chaos",
    "resilience",
    "diagnostics",
    "failures",
  ];
  for (const route of [
    "/app",
    ...recipes.map((recipe) => "/cookbook/" + recipe),
  ])
    await visit(route);
  await page.goto(base + "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "flover-solid",
  );
  await page.screenshot({ path: artifact("landing.png") });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
    await page.screenshot({ path: artifact(`landing-${width}.png`) });
  }
  console.log(
    `${categories.length} catalog categories, seven manual chapters, three shell previews, fifteen protected recipes, fresh app, probe, and landing passed.`,
  );
};
