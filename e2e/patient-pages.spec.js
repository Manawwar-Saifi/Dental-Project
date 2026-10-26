import { test, expect } from "@playwright/test";
import { patientLogin } from "./helpers/patient-auth.js";

test.describe("Patient Portal Pages", () => {
  test.beforeEach(async ({ page }) => {
    await patientLogin(page);
  });

  test("should navigate to payments page", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");

    // Use .first() to avoid strict mode when multiple headings match
    const heading = page.getByRole("heading", { name: /payment/i }).first();
    await expect(heading).toBeVisible();
  });

  test("should navigate to reports page", async ({ page }) => {
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /report/i }).first();
    await expect(heading).toBeVisible();
  });

  test("should navigate to treatments page", async ({ page }) => {
    await page.goto("/treatments");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /treatment/i }).first();
    await expect(heading).toBeVisible();
  });

  test("should navigate to profile page", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Profile page uses MUI components, check for name input field instead of form tag
    const nameField = page.getByLabel(/name/i).first();
    await expect(nameField).toBeVisible();
  });

  test("should navigate to membership page", async ({ page }) => {
    await page.goto("/membership");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /membership/i }).first();
    await expect(heading).toBeVisible();
  });
});
