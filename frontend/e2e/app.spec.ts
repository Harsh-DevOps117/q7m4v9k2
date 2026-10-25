import { test, expect } from "@playwright/test";

test("decision workflow, retrospective overlay, accuracy drill-down and export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("190.3", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("24/24 forecast hours")).toBeVisible();
  await page.getByRole("button", { name: "Show 24 hours" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Published GMT" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Actual MW" }),
  ).not.toBeVisible();
  await page.getByRole("checkbox", { name: "Show actuals" }).check();
  await expect(
    page.getByRole("columnheader", { name: "Actual MW" }),
  ).toBeVisible();
  await expect(
    page.getByText("Retrospective overlay:", { exact: false }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("wind-desk-2026-01-15-0900.csv");
  await page
    .getByRole("button", { name: "Forecast accuracy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Know the forecast’s limits." }),
  ).toBeVisible();
  await expect(page.getByText("744 of 744 expected hours")).toBeVisible();
  await page.getByRole("button", { name: "31 Jan 2026 ↗" }).click();
  await expect(
    page.getByRole("heading", { name: "Tomorrow, with perspective." }),
  ).toBeVisible();
  await expect(page.getByLabel("Decision date")).toHaveValue("2026-01-31");
  await expect(page.getByRole("button", { name: "Next day" })).toBeDisabled();
  await page.getByLabel("Decision date").fill("2026-01-01");
  await expect(
    page.getByText("Not enough prior days", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Decision cutoff").selectOption("07:00");
  await expect(
    page.getByText("07:00 GMT are included.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Data & methodology" }).click();
  await expect(
    page.getByRole("heading", { name: "Reconstruct what was knowable" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile layout fits viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("24/24 forecast hours")).toBeAttached();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "../artifacts/mobile.png", fullPage: true });
});

test("API outage is visible and retry recovers", async ({ page }) => {
  await page.route("**/api/day?**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Data unavailable" }),
  ).toBeVisible();
  await page.unroute("**/api/day?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("24/24 forecast hours")).toBeVisible();
});

test("capture desktop workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(page.getByText("24/24 forecast hours")).toBeVisible();
  await page.screenshot({ path: "../artifacts/desktop.png", fullPage: true });
});
