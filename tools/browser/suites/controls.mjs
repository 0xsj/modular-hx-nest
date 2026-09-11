import assert from "node:assert/strict";
import { expect } from "playwright/test";
export default async ({ page, errors, base, artifact, axePath }) => {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(base + "/kitchen-sink/pickers", {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Pickers", level: 1 }).waitFor();
  await page.screenshot({
    path: artifact("flover-pickers.png"),
    caret: "initial",
    fullPage: false,
  });
  const owner = page.getByRole("combobox", {
    name: "Project owner",
    exact: true,
  });
  await owner.fill("Grace");
  await expect(page.getByRole("option")).toHaveCount(1);
  await owner.press("ArrowDown");
  await owner.press("Enter");
  await expect(owner).toHaveValue("Grace Hopper");
  await expect(page.locator("#combobox output")).toHaveText("grace");
  await owner.fill("no-such-person");
  await expect(
    page.getByText("No matching options.", { exact: true }),
  ).toBeVisible();
  await owner.press("Escape");
  await expect(owner).toHaveValue("Grace Hopper");
  await page
    .getByRole("button", {
      name: "Show options for Project owner",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("option", { name: /Alan Turing/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(owner).toBeFocused();
  await page
    .getByRole("button", { name: "Clear Project owner", exact: true })
    .click();
  await expect(page.locator("#combobox output")).toHaveText("None");
  const topics = page.getByRole("combobox", {
    name: "Project topics",
    exact: true,
  });
  await topics.fill("Research");
  await expect(page.getByRole("option")).toHaveCount(1);
  await topics.press("ArrowDown");
  await topics.press("Enter");
  await expect(page.locator("#multiselect output")).toHaveText(
    "design, accessibility, research",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("grid", { name: "Selected Project topics", exact: true })
    .getByRole("row", { name: "Research", exact: true })
    .focus();
  await page.keyboard.press("Delete");
  await expect(page.locator("#multiselect output")).toHaveText(
    "design, accessibility",
  );
  await page
    .getByRole("button", {
      name: "Show options for Project topics",
      exact: true,
    })
    .click();
  await page.screenshot({
    path: artifact("flover-multiselect-open.png"),
    caret: "initial",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(topics).toBeFocused();
  const emptyTrigger = page.getByRole("button", {
    name: "Show options for No available owners",
    exact: true,
  });
  await emptyTrigger.scrollIntoViewIfNeeded();
  await emptyTrigger.click();
  await expect(page.getByText("No options available.", { exact: true }))
    .toBeVisible()
    .catch(async (error) => {
      console.log(
        "Empty state input",
        await page
          .getByRole("combobox", { name: "No available owners", exact: true })
          .evaluate((el) => el.outerHTML),
      );
      console.log(
        "Listboxes:",
        await page.getByRole("listbox").allTextContents(),
      );
      console.log("Errors so far", errors);
      throw error;
    });
  await page.keyboard.press("Escape");
  console.log(
    "Choices: keyboard selection, no match, empty options, disabled choice, tag removal, and dismissal passed.",
  );

  const trigger = page.getByRole("button", {
    name: "Choose Due date",
    exact: true,
  });
  await trigger.click();
  const calendar = page.getByRole("dialog", {
    name: "Choose Due date",
    exact: true,
  });
  await calendar.waitFor();
  await expect(
    calendar.getByRole("button", { name: /10 September 2026/ }),
  ).toBeFocused();
  await page.screenshot({
    path: artifact("flover-date-open.png"),
    caret: "initial",
  });
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#datepicker output")).toHaveText("2026-09-11");
  await expect(calendar).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(
    calendar.getByRole("button", { name: /11 September 2026/ }),
  ).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(
    calendar.getByRole("button", { name: /11 October 2026/ }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#datepicker output")).toHaveText("2026-10-11");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const rangeTrigger = page.getByRole("button", {
    name: "Choose Reporting period",
    exact: true,
  });
  await rangeTrigger.click();
  const rangeCalendar = page.getByRole("dialog", {
    name: "Choose Reporting period",
    exact: true,
  });
  await rangeCalendar
    .getByRole("button", { name: /20 September 2026/ })
    .click();
  await expect(page.locator("#daterangepicker output")).toHaveText(
    "2026-09-10 → 2026-09-14",
  );
  await rangeCalendar
    .getByRole("button", { name: /22 September 2026/ })
    .click();
  await expect(page.locator("#daterangepicker output")).toHaveText(
    "2026-09-20 → 2026-09-22",
  );
  await expect(rangeTrigger).toBeFocused();
  await rangeTrigger.click();
  await page.screenshot({
    path: artifact("flover-date-range-open.png"),
    caret: "initial",
  });
  await rangeCalendar
    .getByRole("button", { name: /5 September 2026/ })
    .first()
    .click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#daterangepicker output")).toHaveText(
    "2026-09-20 → 2026-09-22",
  );
  await rangeTrigger.click();
  await rangeCalendar
    .getByRole("button", { name: /25 September 2026/ })
    .click();
  await page.keyboard.press("Enter");
  await expect(page.locator("#daterangepicker output")).toHaveText(
    "2026-09-25 → 2026-09-25",
  );
  await page
    .getByRole("button", { name: "Choose September appointment", exact: true })
    .click();
  const appointment = page.getByRole("dialog", {
    name: "Choose September appointment",
    exact: true,
  });
  await expect(
    appointment.getByRole("button", { name: /18 September 2026/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    appointment.getByRole("button", { name: "Previous", exact: true }).first(),
  ).toBeDisabled();
  await expect(
    appointment.getByRole("button", { name: "Next", exact: true }).first(),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Choose Booking window", exact: true })
    .click();
  const booking = page.getByRole("dialog", {
    name: "Choose Booking window",
    exact: true,
  });
  await booking.getByRole("button", { name: /16 September 2026/ }).click();
  await expect(
    booking.getByRole("button", { name: /20 September 2026/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByLabel("Selected booking", { exact: true })).toHaveText(
    "2026-09-10 → 2026-09-12",
  );
  await booking.getByRole("button", { name: /17 September 2026/ }).click();
  await expect(page.getByLabel("Selected booking", { exact: true })).toHaveText(
    "2026-09-16 → 2026-09-17",
  );
  await expect(booking).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Choose Booking window", exact: true }),
  ).toBeFocused();
  console.log(
    "Dates: day/month keys, focus restoration, inclusive/same-day ranges, cancelled draft, bounds and unavailable dates passed.",
  );

  const formOwner = page.getByRole("combobox", {
    name: "Form owner",
    exact: true,
  });
  await formOwner.click();
  await expect(formOwner).toBeFocused();
  await formOwner.fill("Grace");
  await expect(page.getByRole("option")).toHaveCount(1);
  await formOwner.press("ArrowDown");
  await formOwner.press("Enter");
  await expect(formOwner).toHaveValue("Grace Hopper");
  await page
    .locator("#form-submission-and-reset")
    .getByRole("button", { name: "Remove Design systems", exact: true })
    .click();
  await page.getByRole("button", { name: "Inspect submitted values" }).click();
  await expect(page.getByLabel("Submitted picker values")).toHaveText(
    "owner: grace\ntopic: platform\ndueDate: 2026-09-10\nstartDate: 2026-09-10\nendDate: 2026-09-14",
  );
  await page.getByRole("button", { name: "Reset form" }).click();
  await expect(formOwner).toHaveValue("Ada Lovelace");
  await page.getByRole("button", { name: "Inspect submitted values" }).click();
  await expect(page.getByLabel("Submitted picker values")).toContainText(
    "topic: design\ntopic: platform",
  );
  await page.getByRole("button", { name: "Clear Form owner" }).click();
  await page.getByRole("button", { name: "Inspect submitted values" }).click();
  assert.equal(await formOwner.evaluate((el) => el.validity.valid), false);
  await page.getByRole("button", { name: "Reset form" }).click();
  console.log(
    "Native form IDs, repeated values, required validation, and reset passed.",
  );

  // Isolate segment editing from the preceding form/combobox scenario.
  await page.reload({ waitUntil: "networkidle" });
  const formDay = page
    .getByRole("group", { name: "Form due date", exact: true })
    .getByRole("spinbutton", { name: "Day", exact: true });
  await expect(formDay).toHaveText("10");
  const formDateGroup = page.getByRole("group", {
    name: "Form due date",
    exact: true,
  });
  await expect(
    formDateGroup.getByRole("spinbutton", { name: "Month", exact: true }),
  ).toHaveText("09");
  await expect(
    formDateGroup.getByRole("spinbutton", { name: "Year", exact: true }),
  ).toHaveText("2026");
  await formDay.focus();
  await formDay.press("Backspace");
  await formDay.press("Backspace");
  await expect(formDay).toHaveText("dd");
  const nativeDate = page.locator('input[name="dueDate"]');
  await expect(nativeDate).toHaveValue("");
  await expect(
    formDateGroup.getByRole("spinbutton", { name: "Month", exact: true }),
  ).toHaveText("09");
  await expect(
    formDateGroup.getByRole("spinbutton", { name: "Year", exact: true }),
  ).toHaveText("2026");
  await expect
    .poll(() => nativeDate.evaluate((el) => el.validity.valid))
    .toBe(false);
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(formDay).toHaveText("10");
  await expect(nativeDate).toHaveValue("2026-09-10");
  assert.equal(await nativeDate.evaluate((el) => el.checkValidity()), true);
  console.log(
    "Incomplete date segments block stale native values; reset restores the initial date.",
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
        document.getAnimations().map((animation) => animation.finished),
      );
    });
    const violations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    console.log(theme, "axe violations:", JSON.stringify(violations));
    if (violations.length)
      console.log(
        JSON.stringify(
          await page.evaluate(async () =>
            (
              await axe.run(document, {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa"],
                },
              })
            ).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
          ),
        ),
      );
    assert.deepEqual(violations, []);
    await trigger.click();
    const openViolations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    console.log(
      theme,
      "calendar axe violations:",
      JSON.stringify(openViolations),
    );
    assert.deepEqual(openViolations, []);
    await page.screenshot({
      path: artifact("flover-calendar-" + theme.toLowerCase() + ".png"),
      caret: "initial",
    });
    await page.keyboard.press("Escape");
  }
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const density of ["Comfortable", "Compact"]) {
      await page.getByRole("radio", { name: density, exact: true }).click();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
      );
      await rangeTrigger.click();
      const bounds = await rangeCalendar.boundingBox();
      assert.ok(
        bounds.x >= 0 && bounds.x + bounds.width <= width + 1,
        JSON.stringify(bounds),
      );
      if (width === 390)
        await page.screenshot({
          path: artifact(
            "flover-picker-mobile-" + density.toLowerCase() + ".png",
          ),
          caret: "initial",
        });
      await page.keyboard.press("Escape");
    }
  }
  console.log(
    "Themes, densities, and 320/390/768px layouts passed. Page/console errors:",
    JSON.stringify(errors),
  );
  assert.deepEqual(errors, []);
};
