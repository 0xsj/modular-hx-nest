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
  const button = (name) => page.getByRole("button", { name, exact: true });
  const choose = async (label, option) => {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  await page.goto(base + "/cookbook/session");
  await page.getByLabel(/Email/).fill("ada@example.com");
  await page.getByLabel(/Password/).fill("password");
  await button("Sign in").click();
  await expect(
    page.getByRole("heading", { name: "Your recovered workspace" }),
  ).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  const name = page.getByRole("textbox", { name: "Draft name", exact: true });
  await name.fill("Retained through sign-in");
  await button("Expire demo session now").click();
  await expect(name).toHaveCount(0);
  await choose("Demo sign-in account", "Different account");
  await button("Simulate sign-in and return").click();
  await expect(
    page.getByText("This is a different account", { exact: true }),
  ).toBeVisible();
  await expect(button("Save draft")).toHaveCount(0);
  await choose("Demo sign-in account", "Original account");
  await page
    .getByRole("checkbox", { name: "Make sign-in verification unavailable" })
    .check();
  await button("Simulate sign-in and return").click();
  await expect(
    page.getByText("Verification failed", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Make sign-in verification unavailable" })
    .uncheck();
  await button("Simulate sign-in and return").click();
  await expect(name).toHaveValue("Retained through sign-in");
  await expect(page).toHaveURL(/\/cookbook\/session\?view=editor#draft$/);
  await page
    .getByRole("checkbox", { name: "Expire after a save commits" })
    .check();
  await button("Save draft").click();
  await expect(
    page.getByRole("heading", { name: "Sign in to resume" }),
  ).toBeVisible();
  await page.reload();
  await expect(name).toHaveValue("Retained through sign-in");
  await expect(button("Save draft")).toBeDisabled();
  await button("Check original save").click();
  await expect(
    page.getByText("Save confirmed. Your draft matches the receipt.", {
      exact: true,
    }),
  ).toBeVisible();
  console.log(
    "Session expiry, account mismatch, failed verification, return address, durable unresolved operation, and reconciliation passed.",
  );

  await page.getByRole("link", { name: "Capabilities", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Access can change while you work" }),
  ).toBeVisible();
  await expect(button("Update workspace")).toBeEnabled();
  await button("Open protected content").click();
  await expect(
    page.getByText("Workspace: launch planning", { exact: true }),
  ).toBeVisible();
  await button("Revoke without notifying this page").click();
  await expect(button("Update workspace")).toBeEnabled();
  await button("Update workspace").click();
  await expect(
    page.getByText("Access refused by the server", { exact: true }),
  ).toBeVisible();
  await expect(button("Update workspace")).toBeDisabled();
  await expect(
    page.getByText("Workspace: launch planning", { exact: true }),
  ).toHaveCount(0);
  await button("Refresh permissions").click();
  await expect(
    page.getByText("Read workspace: Unavailable", { exact: true }),
  ).toBeVisible();
  await button("Probe a server-protected read").click();
  await expect(
    page.getByText("You no longer have access to this workspace.", {
      exact: true,
    }),
  ).toBeVisible();
  await button("Make read-only").click();
  await expect(button("Open protected content")).toBeEnabled();
  await expect(button("Update workspace")).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Make permission reads unavailable" })
    .check();
  await expect(
    page.getByText("Permissions could not be verified", { exact: true }),
  ).toBeVisible();
  await expect(button("Open protected content")).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Make permission reads unavailable" })
    .uncheck();
  await button("Grant full access").click();
  await expect(button("Update workspace")).toBeEnabled();
  await button("Revoke and notify").click();
  await expect(button("Update workspace")).toBeDisabled();
  console.log(
    "Permission reasons, stale grant refusal, forbidden read, read-only policy, unavailable policy and notified revocation passed.",
  );

  await page
    .getByRole("link", { name: "Long-running jobs", exact: true })
    .click();
  await expect(button("Request cancellation")).toBeEnabled();
  await button("Stop watching").click();
  await button("Advance server job").click();
  await expect(
    page.getByText("Queued. No progress has been measured.", { exact: true }),
  ).toBeVisible();
  await button("Resume watching").click();
  await expect(
    page.getByText("Running · progress has not been measured", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute("value");
  await button("Disconnect").click();
  await expect(
    page.getByText("Job refresh failed", { exact: true }),
  ).toBeVisible();
  await button("Advance server job").click();
  await button("Advance server job").click();
  await button("Reconnect").click();
  await expect(page.getByText("Job completed", { exact: true })).toBeVisible();
  await button("Reset job simulation").click();
  await expect(
    page.getByText("Queued. No progress has been measured.", { exact: true }),
  ).toBeVisible();
  await expect(button("Request cancellation")).toBeEnabled();
  await expect(button("Request cancellation")).toBeEnabled();
  await button("Request cancellation").click();
  await expect(
    page.getByText(
      "Request accepted. Keep watching for the final job state; completion may still win the race.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Cancellation confirmed", { exact: true }),
  ).toHaveCount(0);
  await button("Advance server job").click();
  await expect(
    page.getByText("Cancellation confirmed", { exact: true }),
  ).toBeVisible();
  await button("Reset job simulation").click();
  await expect(
    page.getByText("Queued. No progress has been measured.", { exact: true }),
  ).toBeVisible();
  await expect(button("Request cancellation")).toBeEnabled();
  await choose("Cancellation behavior", "Accept, but lose the acknowledgment");
  await button("Request cancellation").click();
  await expect(
    page.getByText("The request outcome is unknown.", { exact: false }),
  ).toBeVisible();
  await button("Advance server job").click();
  await expect(
    page.getByText("Cancellation confirmed", { exact: true }),
  ).toBeVisible();
  await button("Reset job simulation").click();
  await expect(
    page.getByText("Queued. No progress has been measured.", { exact: true }),
  ).toBeVisible();
  await expect(button("Request cancellation")).toBeEnabled();
  await choose("Cancellation behavior", "Completion wins the race");
  await button("Request cancellation").click();
  await expect(page.getByText("Job completed", { exact: true })).toBeVisible();
  await expect(
    page.getByText("The job finished before cancellation could be accepted.", {
      exact: true,
    }),
  ).toBeVisible();
  await choose("Example job", "Import records");
  await expect(
    page.getByRole("heading", { name: "Records import" }),
  ).toBeVisible();
  await button("Fail server job").click();
  await expect(page.getByText("Job failed", { exact: true })).toBeVisible();
  console.log(
    "Jobs: stop/resume, unknown progress, disconnected completion, cancellation acknowledgment, lost response, completion race and failed import passed.",
  );

  await page.getByRole("link", { name: "Localization", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make room for another language" }),
  ).toBeVisible();
  const preview = page.getByRole("region", {
    name: "Localized workspace preview",
  });
  await expect(preview).toContainText("Sep 10, 2026");
  await choose("Time zone", "New York");
  await expect(preview).toContainText("Sep 9, 2026");
  await choose("Currency presentation", "JPY");
  await expect(preview).toContainText("1,300");
  await page
    .getByRole("checkbox", { name: "Simulate invalid source values" })
    .check();
  await expect(preview).toContainText("Not available");
  await expect(preview).not.toContainText("NaN");
  await page
    .getByRole("checkbox", { name: "Simulate invalid source values" })
    .uncheck();
  for (const theme of ["Light", "Dark"]) {
    await button("Appearance").click();
    await page.getByRole("radio", { name: theme, exact: true }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const language of ["Deutsch · long text", "العربية · RTL"]) {
        await choose("Language and direction", language);
        await preview.scrollIntoViewIfNeeded();
        const rtl = language.includes("RTL");
        await expect(preview).toHaveAttribute("dir", rtl ? "rtl" : "ltr");
        const action = preview.getByRole("button");
        await action.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute("dir", rtl ? "rtl" : "ltr");
        const box = await dialog.boundingBox();
        assert(
          box.x >= 0 && box.x + box.width <= width + 1,
          `${language} dialog outside ${width}: ${JSON.stringify(box)}`,
        );
        assert(
          Math.abs(box.x + box.width / 2 - width / 2) < 2,
          "Dialog not centered",
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          width,
          "page overflows",
        );
        await page.screenshot({
          path: artifact(
            `flover-locale-${theme}-${width}-${rtl ? "rtl" : "long"}.png`,
          ),
          caret: "initial",
        });
        await page.keyboard.press("Escape");
        await expect(action).toBeFocused();
      }
    }
  }
  console.log(
    "Locale/time-zone/currency values, invalid data, long/RTL text, dialog centering, Escape/focus return and responsive widths passed in both themes.",
  );
  for (const route of ["session", "access", "jobs"]) {
    await page.goto(base + "/cookbook/" + route);
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      390,
      route + " mobile overflow",
    );
    await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: artifact(`flover-${route}-mobile.png`),
      caret: "initial",
    });
  }
  assert.deepEqual(errors, []);
  console.log("No hydration or browser errors.");
};
